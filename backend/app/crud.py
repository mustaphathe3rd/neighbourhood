# backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, desc, text, and_
from sqlalchemy import or_, func
from .utils import auth
from . import schemas
from datetime import datetime
from .models import models
from geoalchemy2 import Geography 
from geoalchemy2.shape import to_shape 
from thefuzz import process
from typing import Optional
from sqlalchemy.dialects import postgresql 

# A simple dictionary to store the approximate max internal radius for each state in KM
STATE_MAX_RADII = {
    "Rivers": 50,
    "Lagos": 30,
    "Imo": 40,
    "Abuja (FCT)": 35,
    # Add other states as needed for your demo
}


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name = user.name,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user    

def authenticate_user(db: Session, username: str, password: str):
    # Allow user to log in with either email or name
    user = db.query(models.User).filter(
        or_(models.User.email == username, models.User.name == username)
    ).first()
    if not user or not auth.verify_password(password, user.hashed_password):
        return None
    return user

def get_markets_near_location(db: Session, lat: float, lon: float, radius_km: int):
    """
    Finds market areas within a certain radius (in kilometers) of a given lat/lon.
    """
    radius_meters = radius_km * 1000
    user_location_geography = f'POINT({lon} {lat})'

    # Build the query object without executing it yet
    query_obj = db.query(models.MarketArea).filter(
        func.ST_DWithin(
            models.MarketArea.location.cast(Geography),
            func.ST_GeographyFromText(user_location_geography),
            radius_meters
        )
    )

    # --- ADD THIS DEBUGGING BLOCK ---
    # Compile the query to a string with the actual values
    compiled_query = query_obj.statement.compile(
        dialect=postgresql.dialect(),
        compile_kwargs={"literal_binds": True}
    )
    print("--- DEBUG: GENERATED SQL QUERY ---")
    print(compiled_query)
    print("---------------------------------")
    # --- END OF DEBUGGING BLOCK ---

    # Now execute the query
    return query_obj.all()
    
def get_states(db: Session):
    return db.query(models.State).order_by(models.State.name).all()

def get_cities_by_state(db:Session, state_id: int):
    return db.query(models.City).filter(models.City.state_id == state_id).order_by(models.City.name).all()

def get_markets_by_city(db: Session, city_id: int):
    return db.query(models.MarketArea).filter(models.MarketArea.city_id == city_id).order_by(models.MarketArea.name).all()

def get_product_by_barcode(db: Session, barcode: str):
    return db.query(models.Product).filter(models.Product.barcode == barcode).first()

def unified_search(
    db: Session,
    query: str,
    sort_by: str,
    lat: Optional[float],
    lon: Optional[float],
    radius_km: Optional[int],
    city_id: Optional[int]
):
    """
    The definitive, unified search function.
    Correctly calculates per-product, per-store ratings and distance.
    """
    
    # Determine user's state if GPS coordinates are provided
    user_state = None
    if lat is not None and lon is not None:
        user_point = sql_func.ST_SetSRID(sql_func.ST_MakePoint(lon, lat), 4326)
        state_boundary_query = db.query(models.StateBoundary.state_name).filter(
            sql_func.ST_Contains(models.StateBoundary.geom, user_point)
        ).first()
        if state_boundary_query:
            user_state = state_boundary_query[0]

    # Step 1: Create a subquery to calculate avg_rating PER STORE for each product
    # This provides more granular ratings than just per-product averages
    review_subquery = db.query(
        models.Review.product_id,
        models.Review.store_id,
        sql_func.avg(models.Review.rating).label("avg_rating")
    ).group_by(models.Review.product_id, models.Review.store_id).subquery()
    
    # Step 2: Build the main query, starting explicitly from the Price table
    q = db.query(
        models.Price,
        review_subquery.c.avg_rating
    ).select_from(models.Price)
    
    # Step 3: Join all the necessary tables
    q = q.join(models.Product)
    q = q.join(models.Store)
    q = q.join(models.MarketArea)
    
    # Step 4: Use an outerjoin to the subquery on BOTH product_id and store_id
    # This ensures we get store-specific ratings while still including products with no reviews
    q = q.outerjoin(
        review_subquery, 
        and_(
            models.Price.product_id == review_subquery.c.product_id,
            models.Price.store_id == review_subquery.c.store_id
        )
    )
    
    # Step 5: Add filters for product name and location
    q = q.filter(models.Product.name.ilike(f"%{query}%"))
    
    if city_id:
        q = q.filter(models.MarketArea.city_id == city_id)
    
    # Step 6: Add distance calculation and filtering if GPS is used
    if lat is not None and lon is not None:
        user_point = sql_func.ST_SetSRID(sql_func.ST_MakePoint(lon, lat), 4326)
        q = q.add_columns(
            sql_func.ST_Distance(
                models.MarketArea.location.cast(Geography),
                user_point.cast(Geography)
            ).label("distance_meters")
        )
        if radius_km:
            q = q.filter(sql_func.ST_DWithin(
                models.MarketArea.location.cast(Geography),
                user_point.cast(Geography),
                radius_km * 1000
            ))
    else:
        # Add a null distance column if no GPS for consistent result shape
        q = q.add_columns(text("NULL AS distance_meters"))
    
    # Step 7: Apply sorting
    if sort_by == "price_desc":
        q = q.order_by(desc(models.Price.price))
    elif sort_by == "rating_desc":
        q = q.order_by(desc("avg_rating").nullslast())
    elif sort_by == "distance_asc" and lat is not None:
        q = q.order_by("distance_meters")
    else:
        q = q.order_by(models.Price.price.asc())
    
    # Step 8: Execute the query and format the results
    results = q.all()
    
    formatted_results = []
    for price_obj, avg_rating, distance_meters in results:
        market_state = price_obj.store.market_area.city.state.name
        location_shape = to_shape(price_obj.store.market_area.location)
        res = {
            "product_id": price_obj.product.id,
            "product_name": price_obj.product.name,
            "image_url": price_obj.product.image_url,
            "price": price_obj.price,
            "store_id": price_obj.store.id,
            "store_name": price_obj.store.name,
            "market_area": price_obj.store.market_area.name,
            "city": price_obj.store.market_area.city.name,
            "state": price_obj.store.market_area.city.state.name,
            "timestamp": price_obj.timestamp,
            "stock_level": price_obj.stock_level,
            "avg_rating": avg_rating,
            "distance_km": round(distance_meters / 1000, 2) if distance_meters is not None else None,
            "is_out_of_state": user_state is not None and market_state != user_state,
            "lat": location_shape.y,
            "lon": location_shape.x,
        }
        formatted_results.append(res)
    
    return formatted_results

def get_prices_for_product(
    db: Session, 
    product_id: int, 
    lat: Optional[float] = None, 
    lon: Optional[float] = None, 
    radius_km: Optional[int] = None,
    city_id: Optional[int] = None
):
    """
    Finds all price listings for a specific product, filtered by EITHER a
    GPS radius OR a specific city_id.
    """
    
    # Base query
    q = db.query(
        models.Price,
        sql_func.avg(models.Review.rating).label("avg_rating")
    ).select_from(models.Price).join(models.Product).join(models.Store).join(models.MarketArea).outerjoin(models.Review).filter(
        models.Price.product_id == product_id
    ).group_by(models.Price.id, models.Product.id, models.Store.id, models.MarketArea.id)

    # This is the key change. We now correctly handle both GPS and manual cases
    # while ensuring the data shape is always consistent.
    if lat is not None and lon is not None and radius_km is not None:
        user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
        # Add the distance column to the query
        q = q.add_columns(
            sql_func.ST_Distance(
                models.MarketArea.location.cast(Geography),
                user_point.cast(Geography)
            ).label("distance_meters")
        )
        # CRUCIAL: Add the filter to only include stores within the radius
        q = q.filter(
            func.ST_DWithin(
                models.MarketArea.location.cast(Geography),
                user_point.cast(Geography),
                radius_km * 1000
            )
        )
    else:
        # If not using GPS, add a NULL distance column to keep the data shape the same
        q = q.add_columns(text("NULL AS distance_meters"))
        if city_id:
            # Filter by the manually selected city
            q = q.filter(models.MarketArea.city_id == city_id)

    results = q.order_by(models.Price.price.asc()).all()
    
    # Format the results (this part is now safe because 'results' always has 3 items per row)
    formatted_results = []
    for price, avg_rating, distance_meters in results:
        location_shape = to_shape(price.store.market_area.location) if price.store.market_area.location else None 
        res = {
            "product_id": price.product.id,
            "product_name": price.product.name,
            "price": price.price,
            "store_id": price.store.id,
            "store_name": price.store.name,
            "market_area": price.store.market_area.name,
            "city": price.store.market_area.city.name,
            "state": price.store.market_area.city.state.name,
            "timestamp": price.timestamp,
            "lat": location_shape.y if location_shape else None,
            "lon": location_shape.x if location_shape else None,
            "image_url": price.product.image_url,
            "stock_level": price.stock_level,
            "avg_rating": avg_rating,
            "distance_km": round(distance_meters / 1000, 2) if distance_meters is not None else None,
        }
        formatted_results.append(res)
        
    return formatted_results
def get_favorite_stores(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        return user.favorite_stores # Return the direct list of Store objects
    return []

def add_favorite_store(db: Session, user_id: int, store_id: int) -> Optional[models.Store]:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    
    if not user or not store or store in user.favorite_stores:
        return None # Return None if something is wrong
        
    user.favorite_stores.append(store)
    db.commit()
    return store # Return the store that was added

def remove_favorite_store(db: Session, user_id: int, store_id: int) -> bool:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    
    if user and store and store in user.favorite_stores:
        user.favorite_stores.remove(store)
        db.commit()
        return True # Return True on success
    return False

def create_review(db: Session, review:schemas.ReviewCreate, user_id: int):
    db_review = models.Review(
        rating=review.rating,
        comment=review.comment,
        product_id=review.product_id,
        store_id=review.store_id,
        user_id=user_id,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_reviews_for_product(db: Session, product_id: int, store_id: int):
    return db.query(models.Review).filter(
        models.Review.product_id == product_id,
        models.Review.store_id == store_id # <-- Add the store filter
    ).order_by(desc(models.Review.timestamp)).all()

def get_or_create_shopping_list(db: Session, user_id: int):
    """
    Finds a shopping list for a given user. 
    If one doesn't exist, it creates a new one.
    """
    shopping_list = db.query(models.ShoppingList).filter(models.ShoppingList.user_id == user_id).first()
    if not shopping_list:
        shopping_list = models.ShoppingList(user_id=user_id)
        db.add(shopping_list)
        db.commit()
        db.refresh(shopping_list)
    return shopping_list

def add_item_to_list(db: Session, list_id: int, item_data: schemas.ListItemCreate):
    # Check if this exact item from this exact store is already in the list
    db_item = db.query(models.ShoppingListItem).filter(
        models.ShoppingListItem.shopping_list_id == list_id,
        models.ShoppingListItem.product_id == item_data.product_id,
        models.ShoppingListItem.store_id == item_data.store_id
    ).first()

    if db_item:
        db_item.quantity += 1
    else:
        db_item = models.ShoppingListItem(
            shopping_list_id=list_id, 
            product_id=item_data.product_id, 
            store_id=item_data.store_id,
            price_at_addition=item_data.price
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_item)
    return db_item

def update_item_quantity(db: Session, item_id: int, quantity: int):
    db_item = db.query(models.ShoppingListItem).filter(models.ShoppingListItem.id == item_id).first()
    if db_item:
        if quantity <= 0:
            db.delete(db_item)
        else:
            db_item.quantity = quantity
        db.commit()
    return db_item

def remove_list_item(db: Session, item_id: int):
    db_item = db.query(models.ShoppingListItem).filter(models.ShoppingListItem.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
    return

def create_store_for_user(db: Session, store_data: schemas.StoreCreate, user_id: int):
    # The function creates a new Store and links it to the user's ID.
    db_store = models.Store(
        name=store_data.name,
        market_area_id=store_data.market_area_id,
        owner_id=user_id
    )
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store

def get_prices_for_store(db: Session, store_id: int):
    """
    Gets all of the Price objects associated with a specific store.
    """
    return db.query(models.Price).filter(models.Price.store_id == store_id).all()

def get_all_products(db: Session):
    return db.query(models.Product).order_by(models.Product.name).all()

def create_price_for_store(db: Session, store_id: int, price_data: schemas.PriceCreate):
    # This function creates a new Price entry linked to a store and product
    db_price = models.Price(
        price=price_data.price,
        stock_level=price_data.stock_level,
        product_id=price_data.product_id,
        store_id=store_id,
        timestamp=datetime.utcnow()
    )
    db.add(db_price)
    db.commit()
    db.refresh(db_price)
    return db_price

def get_price_by_id(db: Session, price_id: int):
    # A helper function to find a specific price entry
    return db.query(models.Price).filter(models.Price.id == price_id).first()

def update_price(db: Session, price_id: int, price_data: schemas.PriceUpdate):
    db_price = get_price_by_id(db, price_id=price_id)
    if db_price:
        db_price.price = price_data.price
        db_price.stock_level = price_data.stock_level
        db_price.timestamp = datetime.utcnow()
        db.commit()
        db.refresh(db_price)
    return db_price

def delete_price(db: Session, price_id: int):
    db_price = get_price_by_id(db, price_id=price_id)
    if db_price:
        db.delete(db_price)
        db.commit()
    return db_price 

def log_product_view(db: Session, view_data: schemas.ProductViewLog):
    db_view = models.ProductView(
        product_id=view_data.product_id,
        store_id=view_data.store_id
    )
    db.add(db_view)
    db.commit()
    return

def get_view_counts_for_store(db: Session, store_id: int):
    # This query counts views and groups them by product for the specified store
    results = db.query(
        models.Product.name,
        sql_func.count(models.ProductView.id).label("view_count")
    ).join(models.ProductView).filter(
        models.ProductView.store_id == store_id
    ).group_by(models.Product.name).order_by(desc("view_count")).all()
    
    # Format the results
    return [{"product_name": name, "view_count": count} for name, count in results]

def get_state_info_for_location(db: Session, lat: float, lon: float):
    user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
    
    # Query to find which state polygon contains the user's point
    state_boundary = db.query(models.StateBoundary).filter(
        func.ST_Contains(models.StateBoundary.geom, user_point)
    ).first()

    if not state_boundary:
        return None

    state_name = str(state_boundary.state_name)
    max_radius = STATE_MAX_RADII.get(state_name, 100) # Default to 100km if not in our dict

    return {"state_name": state_name, "max_safe_radius_km": max_radius}