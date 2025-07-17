# backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, desc, text
from sqlalchemy import or_, func
from .utils import auth
from . import models, schemas
from .models import models
from geoalchemy2 import Geography 
from geoalchemy2.shape import to_shape 
from thefuzz import process
from typing import Optional
from sqlalchemy.dialects import postgresql 

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
    lat: Optional[float] = None, 
    lon: Optional[float] = None, 
    radius_km: Optional[int] = None,
    city_id: Optional[int] = None
):
    """A single function to handle all product price searches with starts-with and contains search."""
    
    def build_base_query(search_pattern: str):
        """Build the base query with explicit joins and a given search pattern"""
        # Start by explicitly selecting from the Price table
        q = db.query(
            models.Price,
            sql_func.avg(models.Review.rating).label("avg_rating")
        ).select_from(models.Price)
        
        # Now, explicitly join each table based on the relationships
        q = q.join(models.Product)
        q = q.join(models.Store)
        q = q.join(models.MarketArea)
        # Use an outerjoin for reviews, as not all products may have reviews
        q = q.outerjoin(models.Review, models.Price.product_id == models.Review.product_id)
        
        # Filter by the product name with the given search pattern
        q = q.filter(models.Product.name.ilike(search_pattern))
        
        # Group by all necessary columns to allow for AVG() and COUNT()
        q = q.group_by(models.Price.id, models.Product.id, models.Store.id, models.MarketArea.id)
        
        # Add distance calculation if GPS coordinates are provided
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
        
        # Add city filter if provided
        if city_id:
            q = q.filter(models.MarketArea.city_id == city_id)
        
        return q
    
    def apply_sorting(q, sort_by):
        """Apply sorting logic to the query"""
        if sort_by == "price_desc":
            return q.order_by(desc(models.Price.price))
        elif sort_by == "rating_desc":
            return q.order_by(desc("avg_rating").nullslast())
        elif sort_by == "distance_asc" and lat is not None:
            return q.order_by("distance_meters")
        else:
            return q.order_by(models.Price.price.asc())
    
    # First try "starts with" search
    q = build_base_query(f"{query}%")
    q = apply_sorting(q, sort_by)
    results = q.all()
    
    # If no "starts with" match, try a broader "contains" search
    if not results:
        q = build_base_query(f"%{query}%")
        q = apply_sorting(q, sort_by)
        results = q.all()
    
    # Format results
    formatted_results = []
    # Note: The query now returns a tuple of (Price, avg_rating, distance_meters)
    for price_obj, avg_rating, distance_meters in results:
        location_shape = to_shape(price_obj.store.market_area.location) if price_obj.store.market_area.location else None
        res = {
            "product_id": price_obj.product.id,
            "product_name": price_obj.product.name,
            "price": price_obj.price,
            "store_id": price_obj.store.id,
            "store_name": price_obj.store.name,
            "market_area": price_obj.store.market_area.name,
            "city": price_obj.store.market_area.city.name,
            "state": price_obj.store.market_area.city.state.name,
            "timestamp": price_obj.timestamp,
            "stock_level": price_obj.stock_level,
            "avg_rating": avg_rating,
            "distance_km": (distance_meters / 1000) if distance_meters is not None else None,
            "lat": location_shape.y if location_shape else None, 
            "lon": location_shape.x if location_shape else None,
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
        user_id=user_id,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_reviews_for_product(db: Session, product_id: int):
    return db.query(models.Review).filter(models.Review.product_id == product_id).order_by(desc(models.Review.timestamp)).all()

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
