from app.database import SessionLocal, engine
from app.models import models
from datetime import datetime

# Create all tables
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # --- Location Data ---
    states_data = ["Lagos", "Abuja (FCT)", "Rivers", "Imo"]
    cities_data = {
        "Lagos": ["Ikeja", "Lekki", "Surulere"],
        "Abuja (FCT)": ["Wuse", "Garki", "Maitama"],
        "Rivers": ["Port Harcourt"],
        "Imo": ["Owerri"],
    }
    markets_data = {
        "Ikeja": [("Computer Village", 3.34, 6.60)],
        "Lekki": [("Lekki Market", 3.51, 6.45)],
        "Wuse": [("Wuse Market", 7.45, 9.07)],
        "Port Harcourt": [("Oil Mill Market", 7.05, 4.83), ("Mile 1 Market", 7.00, 4.79)],
        "Owerri": [("Eke Ukwu Owerri", 7.03, 5.48)],
        "Surulere": [("Surulere Market", 3.35, 6.50)], 
        "Garki": [("Garki Model Market", 7.46, 9.03)],
        "Maitama": [("Maitama Market", 7.52, 9.08)],
    }

    # --- Seeding Logic for Locations ---
    print("Seeding locations...")
    # (Your existing location seeding logic goes here. It is correct.)
    # Seeding states...
    for state_name in states_data:
        if not db.query(models.State).filter(models.State.name == state_name).first():
            db.add(models.State(name=state_name))
    db.commit()

    # Seeding cities...
    for state_name, cities in cities_data.items():
        state_obj = db.query(models.State).filter(models.State.name == state_name).one()
        for city_name in cities:
            if not db.query(models.City).filter(models.City.name == city_name).first():
                db.add(models.City(name=city_name, state_id=state_obj.id))
    db.commit()
    
    # Seeding market areas...
    for city_name, markets in markets_data.items():
        city_obj = db.query(models.City).filter(models.City.name == city_name).one()
        for market_name, lon, lat in markets:
            if not db.query(models.MarketArea).filter(models.MarketArea.name == market_name).first():
                location_point = f'POINT({lon} {lat})'
                db.add(models.MarketArea(name=market_name, city_id=city_obj.id, location=location_point))
    db.commit()

    # --- NEW: Seeding Logic for Stores ---
    print("Seeding stores...")
    all_markets = db.query(models.MarketArea).all()
    for market in all_markets:
        if not market.stores:
            # Create one default store for each market area
            default_store = models.Store(name=f"{market.name} Main Store", market_area_id=market.id)
            db.add(default_store)
    db.commit()

    # --- UPDATED Product and Price Data ---
    print("Seeding products and prices...")
    # (The products_to_seed list remains the same as before)
    products_to_seed = [
        {"name": "Indomie Super Pack", "category": "Noodles", "barcode": "615104020202"},
        {"name": "Peak Milk 900g", "category": "Dairy", "barcode": "8712566367469"},
        {"name": "Peak Milk 400g", "category": "Dairy", "barcode": "8712566367407"},
        {"name": "Bag of Rice (50kg)", "category": "Grains", "barcode": "111222333444"},
        {"name": "Milo Tin (500g)", "category": "Beverages", "barcode": "7613036087192"},
        {"name": "Lipton Yellow Label Tea (100 bags)", "category": "Beverages", "barcode": "8901030933221"},
        {"name": "Golden Penny Semovita (1kg)", "category": "Grains", "barcode": "6156000030567"},
        {"name": "Dangote Sugar (1kg)", "category": "Sweeteners", "barcode": "6151100000017"},
        {"name": "Sunlight Detergent (1kg)", "category": "Cleaning", "barcode": "6001087358700"},
        {"name": "Coca-Cola (50cl Pet)", "category": "Beverages", "barcode": "5449000000996"},
    ]
    for p_data in products_to_seed:
        if not db.query(models.Product).filter(models.Product.name == p_data["name"]).first():
            db.add(models.Product(name=p_data["name"], category=p_data["category"], barcode=p_data["barcode"]))
    db.commit()

    prices_to_seed = {
        "Computer Village": [("Indomie Super Pack", 5000), ("Coca-Cola (50cl Pet)", 350), ("Dangote Sugar (1kg)", 1800)],
        "Wuse Market": [("Indomie Super Pack", 4900), ("Peak Milk 900g", 4300),("Golden Penny Semovita (1kg)", 1500),("Lipton Yellow Label Tea (100 bags)", 2200)],
        "Oil Mill Market": [("Bag of Rice (50kg)", 85500), ("Peak Milk 400g", 2150),("Sunlight Detergent (1kg)", 2500),("Milo Tin (500g)", 3500)],
        "Eke Ukwu Owerri": [("Indomie Super Pack", 4850), ("Bag of Rice (50kg)", 84000),("Milo Tin (500g)", 3600),("Dangote Sugar (1kg)", 1750)]
    }

    # Add prices - this will now work correctly
    for market_name, prices in prices_to_seed.items():
        market_obj = db.query(models.MarketArea).filter(models.MarketArea.name == market_name).first()
        # The 'if market_obj.stores:' check is now guaranteed to pass
        if market_obj and market_obj.stores:
            store_obj = market_obj.stores[0]
            for product_name, price_val in prices:
                product_obj = db.query(models.Product).filter(models.Product.name == product_name).first()
                if product_obj:
                    existing_price = db.query(models.Price).filter(models.Price.product_id == product_obj.id, models.Price.store_id == store_obj.id).first()
                    if not existing_price:
                        db.add(models.Price(product_id=product_obj.id, store_id=store_obj.id, price=price_val, timestamp=datetime.utcnow()))
    db.commit()

    print("Product and price seeding complete! 📇")
    print("Seeding complete! 🌱")

finally:
    db.close()