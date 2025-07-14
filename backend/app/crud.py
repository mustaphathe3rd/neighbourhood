# backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from .utils import auth
from . import models, schemas
from .models import models
from geoalchemy2 import Geography 
from thefuzz import process

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

def get_markets_near_location(db: Session, lat: float, lon: float, radius_km: int = 5):
    """
    Finds market areas within a certain radius (in kilometers) of a given lat/lon.
    Uses PostGIS functions for geospatial querying.
    """
    # Define the user's location as a WKT POINT
    user_location = f'POINT({lon} {lat})'
    
    # PostGIS calculates distance in meters, so convert km to meters
    radius_meters = radius_km * 1000

    # Query using ST_DWithin to find markets within the specified distance
    nearby_markets = db.query(models.MarketArea).filter(
        func.ST_DWithin(
            models.MarketArea.location.cast(Geography), # <-- Step 2: Cast the column to Geography
            func.ST_GeographyFromText(user_location),
            radius_meters
        )
    ).all()
    
    return nearby_markets

def get_states(db: Session):
    return db.query(models.State).order_by(models.State.name).all()

def get_cities_by_state(db:Session, state_id: int):
    return db.query(models.City).filter(models.City.state_id == state_id).order_by(models.City.name).all()

def get_markets_by_city(db: Session, city_id: int):
    return db.query(models.MarketArea).filter(models.MarketArea.city_id == city_id).order_by(models.MarketArea.name).all()

def get_product_by_barcode(db: Session, barcode: str):
    return db.query(models.Product).filter(models.Product.barcode == barcode).first()

# def search_products(db: Session, query: str, city_id: int):
#     # Pass 1: Prioritize products that start with the query string in the correct city
#     exact_query = db.query(models.Product).join(models.Price).join(models.Store).join(models.MarketArea).filter(
#         models.MarketArea.city_id == city_id,
#         models.Product.name.ilike(f"{query}%")
#     ).distinct().all()

#     if exact_query:
#         return exact_query

#     # Pass 2: If no direct match, use fuzzy matching as a fallback
#     if len(query) > 2:
#         # Get all unique product names available in the target city
#         all_products_in_city = db.query(models.Product).join(models.Price).join(models.Store).join(models.MarketArea).filter(
#             models.MarketArea.city_id == city_id
#         ).distinct().all()
        
#         # We now have full product objects, not just names
#         if not all_products_in_city:
#             return []

#         # Use a dictionary to map product names to their objects
#         product_map = {p.name: p for p in all_products_in_city}
        
#         # Find the best matches from the names of products available in that city
#         fuzzy_results = process.extract(query, product_map.keys(), limit=5)
        
#         good_matches = []
#         for match_name, score in fuzzy_results:
#             if score > 75: # Higher confidence threshold
#                 good_matches.append(product_map[match_name])

#         return good_matches
    
#     return []

def search_prices_for_product(db: Session, query: str, city_id: int, sort_by: str = "price_asc"):
    """
    Finds all price listings for products matching the query in a specific city,
    with dynamic sorting
    """
    
    price_query = db.query(models.Price).join(models.Product).join(models.Store).join(models.MarketArea).filter(
        models.MarketArea.city_id == city_id,
        models.Product.name.ilike(f"{query}%")
    )

    # --- NEW: Dynamic Sorting Logic ---
    if sort_by == "price_desc":
        price_query = price_query.order_by(models.Price.price.desc())
    # Add more sorting options here later (e.g., rating)
    # elif sort_by == "rating_desc":
    #     price_query = price_query.join(models.Review).order_by(models.Review.rating.desc())
    else: # Default case
        price_query = price_query.order_by(models.Price.price.asc())
    
    db_prices = price_query.all()

    # If no "starts with" match, try a broader "contains" search
    if not db_prices:
        price_query = db.query(models.Price).join(models.Product).join(models.Store).join(models.MarketArea).filter(
            models.MarketArea.city_id == city_id,
            models.Product.name.ilike(f"%{query}%")
        )
        # --- NEW: Dynamic Sorting Logic ---
        if sort_by == "price_desc":
            price_query = price_query.order_by(models.Price.price.desc())
        # Add more sorting options here later (e.g., rating)
        # elif sort_by == "rating_desc":
        #     price_query = price_query.join(models.Review).order_by(models.Review.rating.desc())
        else: # Default case
            price_query = price_query.order_by(models.Price.price.asc())

        db_prices = price_query.all()
    
    # We no longer need the fuzzy search for this core logic, making it more predictable.
    formatted_results = []
    for price_obj in db_prices:
        formatted_results.append({
            "product_id": price_obj.product.id,
            "product_name": price_obj.product.name,
            "price": price_obj.price,
            "store_id": price_obj.store.id,
            "store_name": price_obj.store.name,
            "market_area": price_obj.store.market_area.name,
            "city": price_obj.store.market_area.city.name,
            "state": price_obj.store.market_area.city.state.name,
            "timestamp": price_obj.timestamp
        })
        
    return formatted_results

def get_prices_for_product(db: Session, product_id: int, city_id: int):
    price_query = db.query(models.Price).join(models.Store).join(models.MarketArea).filter(
        models.Price.product_id == product_id,
        models.MarketArea.city_id == city_id # <-- The crucial filter
    ).order_by(models.Price.price.asc()).all()
    
    # Format results
    formatted_results = []
    for price_obj in price_query:
        formatted_results.append({
            "product_id": price_obj.product.id,
            "product_name": price_obj.product.name,
            "store_id": price_obj.store.id,
            "price": price_obj.price,
            "store_name": price_obj.store.name,
            "market_area": price_obj.store.market_area.name,
            "city": price_obj.store.market_area.city.name,
            "state": price_obj.store.market_area.city.state.name,
            "timestamp": price_obj.timestamp
        })
    return formatted_results

def add_favorite_store(db: Session, user_id: int, store_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if user and store and store not in user.favorite_stores:
        user.favorite_stores.append(store)
        db.commit()
    return user

def remove_favorite_store(db: Session, user_id: int, store_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if user and store and store in user.favorite_stores:
        user.favorite_stores.remove(store)
        db.commit()
    return user

def get_favorite_stores(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        # We need to format this data before sending
        formatted_stores = []
        for store in user.favorite_stores:
            formatted_stores.append({
                "id": store.id,
                "name": store.name,
                "market_area": store.market_area.name,
                "city": store.market_area.city.name
            })
        return formatted_stores
    return []

