from app.database import SessionLocal, engine
from app.models import models
from app.utils.auth import get_password_hash
from datetime import datetime
from geoalchemy2.elements import WKTElement
import random

# Ensure all tables are created
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # --- 1. DEFINE EXPANDED DATA ---
    print("Defining expanded sample data...")
    
    # Locations remain the same
    locations = {
        "Lagos": {
            "Ikeja": [("Computer Village", 3.34, 6.60)],
            "Lekki": [("Lekki Market", 3.51, 6.45)],
            "Surulere": [("Surulere Market", 3.35, 6.50)]
        },
        "Rivers": {
            "Port Harcourt": [
                ("Oil Mill Market", 7.05, 4.83), 
                ("Mile 1 Market", 7.00, 4.79)
            ]
        },
        "Imo": {
            "Owerri": [
                ("Eke Ukwu Owerri", 7.03, 5.48), 
                ("Relief Market", 7.05, 5.47),
                ("Owerri Mall", 5.48, 7.06)
            ]
        },
        "Abuja (FCT)": {
            "Wuse": [("Wuse Market", 7.45, 9.07)],
            "Garki": [("Garki Model Market", 7.46, 9.03)],
            "Jabi": [("Jabi Lake Mall", 7.43, 9.08)]
        }
    }

    # Expanded list of 20 products
    products_to_seed = [
    {"name": "Indomie Super Pack", "category": "Noodles", "barcode": "615104020202", "image_url": "https://i.imgur.com/iQyxVhd.jpeg"},
    {"name": "Peak Milk 900g", "category": "Dairy", "barcode": "8712566367469", "image_url": "https://i.imgur.com/W7868un.jpeg"},
    {"name": "Peak Milk 400g", "category": "Dairy", "barcode": "8712566367407", "image_url": "https://i.imgur.com/vnngAKM.jpeg"},
    {"name": "Bag of Rice (50kg)", "category": "Grains", "barcode": "111222333444", "image_url": "https://i.imgur.com/bkQ1RS0.jpeg"},
    {"name": "Milo Tin (500g)", "category": "Beverages", "barcode": "7613036087192", "image_url": "https://i.imgur.com/oDNxC07.png"},
    {"name": "Lipton Yellow Label Tea (100 bags)", "category": "Beverages", "barcode": "8901030933221", "image_url": "https://i.imgur.com/5ob3KeB.jpeg"},
    {"name": "Golden Penny Semovita (1kg)", "category": "Grains", "barcode": "6156000030567", "image_url": "https://i.imgur.com/hWPWAM6.jpeg"},
    {"name": "Dangote Sugar (1kg)", "category": "Sweeteners", "barcode": "6151100000017", "image_url": "https://i.imgur.com/F88eTzv.png"},
    {"name": "Sunlight Detergent (1kg)", "category": "Cleaning", "barcode": "6001087358700", "image_url": "https://i.imgur.com/D1VcM50.jpeg"},
    {"name": "Coca-Cola (50cl Pet)", "category": "Beverages", "barcode": "5449000000996", "image_url": "https://i.imgur.com/2qEwoqK.jpeg"},
    {"name": "Eva Water (75cl)", "category": "Beverages", "barcode": "6156000000012", "image_url": "https://i.imgur.com/7ga1n2S.jpeg"},
    {"name": "Ariel Detergent (800g)", "category": "Cleaning", "barcode": "5410076541575", "image_url": "https://i.imgur.com/tg1nMA3.jpeg"},
    {"name": "Hollandia Yoghurt (1L)", "category": "Dairy", "barcode": "6156000001234", "image_url": "https://i.imgur.com/j57dGca.jpeg"},
    {"name": "Gala Sausage roll", "category": "Snacks", "barcode": "4015400690000", "image_url": "https://i.imgur.com/knPaQCA.png"},
    {"name": "Close Up Toothpaste (140g)", "category": "Personal Care", "barcode": "6001087351000", "image_url": "https://i.imgur.com/BTAIoGE.jpeg"},
    {"name": "Dettol Antiseptic (250ml)", "category": "Personal Care", "barcode": "6001106109307", "image_url": "https://i.imgur.com/nvjfnCg.jpeg"},
    {"name": "Kings Vegetable Oil (5L)", "category": "Cooking Oil", "barcode": "6156000005555", "image_url": "https://i.imgur.com/pXdGv5f.jpeg"},
    {"name": "Omo Washing Powder (1kg)", "category": "Cleaning", "barcode": "6001087358717", "image_url": "https://i.imgur.com/P3fylxP.jpeg"},
    {"name": "Honeywell Wheat Meal (1kg)", "category": "Grains", "barcode": "6156000030574", "image_url": "https://i.imgur.com/cMKqrdV.jpeg"},
    {"name": "Power Horse Energy Drink (250ml)", "category": "Beverages", "barcode": "9002230001006", "image_url": "https://i.imgur.com/jwk7Nj9.jpeg"},
]

    # Expanded list of users and stores
    users_to_seed = [
        {"name": "Ada Consumer", "email": "consumer@test.com", "password": "password", "role": "consumer"},
        {"name": "John Ikeja", "email": "john.ikeja@test.com", "password": "password", "role": "store_owner"},
        {"name": "Blessing Owerri", "email": "blessing.owerri@test.com", "password": "password", "role": "store_owner"},
        {"name": "Mike PH", "email": "mike.ph@test.com", "password": "password", "role": "store_owner"},
        {"name": "Fatima Abuja", "email": "fatima.abuja@test.com", "password": "password", "role": "store_owner"},
    ]
    
    # --- 2. SEEDING LOGIC ---

    # Seed States, Cities, and Markets (same as before)
    print("Seeding locations...")
    for state_name, cities in locations.items():
        state_obj = db.query(models.State).filter(models.State.name == state_name).first()
        if not state_obj:
            state_obj = models.State(name=state_name)
            db.add(state_obj)
            db.commit()
        
        for city_name, markets in cities.items():
            city_obj = db.query(models.City).filter(models.City.name == city_name, models.City.state_id == state_obj.id).first()
            if not city_obj:
                city_obj = models.City(name=city_name, state_id=state_obj.id)
                db.add(city_obj)
                db.commit()

            for market_name, lon, lat in markets:
                if not db.query(models.MarketArea).filter(models.MarketArea.name == market_name).first():
                    location_point = WKTElement(f'POINT({lon} {lat})', srid=4326)
                    db.add(models.MarketArea(name=market_name, city_id=city_obj.id, location=location_point))
    db.commit()

    # Seed Users
    print("Seeding users...")
    for user_data in users_to_seed:
        if not db.query(models.User).filter(models.User.email == user_data["email"]).first():
            hashed_password = get_password_hash(user_data["password"])
            db.add(models.User(**{k: v for k, v in user_data.items() if k != 'password'}, hashed_password=hashed_password))
    db.commit()

    # Seed Stores with more variety
    print("Seeding stores...")
    owners = {u.email: u for u in db.query(models.User).filter(models.User.role == "store_owner").all()}
    markets = {m.name: m for m in db.query(models.MarketArea).all()}
    
    stores_to_seed = [
        {"name": "Tech Hub Electronics", "market": "Computer Village", "owner_email": "john.ikeja@test.com"},
        {"name": "Ikeja Wholesale Goods", "market": "Computer Village", "owner_email": None},
        {"name": "Lekki Fair Price", "market": "Lekki Market", "owner_email": None},
        {"name": "Island Supermart", "market": "Lekki Market", "owner_email": None},
        {"name": "Capital Foods & Groceries", "market": "Wuse Market", "owner_email": "fatima.abuja@test.com"},
        {"name": "Abuja Central Traders", "market": "Wuse Market", "owner_email": None},
        {"name": "Garki Mega Store", "market": "Garki Model Market", "owner_email": None},
        {"name": "Imo Premier Store", "market": "Eke Ukwu Owerri", "owner_email": "blessing.owerri@test.com"},
        {"name": "Owerri Supermart", "market": "Eke Ukwu Owerri", "owner_email": None},
        {"name": "Relief Market Deals", "market": "Relief Market", "owner_email": None},
        {"name": "Riverside Goods", "market": "Oil Mill Market", "owner_email": "mike.ph@test.com"},
        {"name": "The Trading Post", "market": "Oil Mill Market", "owner_email": None},
        {"name": "Mile 1 Provisions", "market": "Mile 1 Market", "owner_email": None},
        {"name": "Shoprite", "market": "Jabi Lake Mall", "owner_email": None},
        {"name": "Shoprite", "market": "Owerri Mall", "owner_email": None},     
    ]

    for store_data in stores_to_seed:
        market = markets.get(store_data["market"])
        if not market:
            continue
        # --- THIS IS THE FIX FOR STORES ---
        # Check for a store with this name ONLY in this specific market
        existing_store = db.query(models.Store).filter_by(name=store_data["name"], market_area_id=market.id).first()
        if not existing_store:
            owner = owners.get(store_data["owner_email"]) if store_data["owner_email"] else None
            db.add(models.Store(name=store_data["name"], market_area_id=market.id, owner_id=owner.id if owner else None))
    db.commit()

    # Seed Products
    print("Seeding products...")
    for p_data in products_to_seed:
        if not db.query(models.Product).filter(models.Product.name == p_data["name"]).first():
            db.add(models.Product(**p_data))
    db.commit()

    # Seed Prices with realistic variations
    print("Seeding prices...")
    all_stores = db.query(models.Store).all()
    all_products = db.query(models.Product).all()

    for store in all_stores:
        # Give each store 5 to 12 random products
        products_for_store = random.sample(all_products, random.randint(5, 12))
        for product in products_for_store:
            if not db.query(models.Price).filter(models.Price.store_id == store.id, models.Price.product_id == product.id).first():
                base_price = random.randint(300, 10000) # Simplified base price
                price_variation = base_price * random.uniform(-0.08, 0.08) # +/- 8% variation
                final_price = round(base_price + price_variation, -1) # Round to nearest 10
                stock = random.randint(1, 3)
                db.add(models.Price(product_id=product.id, store_id=store.id, price=final_price, stock_level=stock, timestamp=datetime.utcnow()))
    db.commit()
    
    # Seed Reviews
    print("Seeding reviews...")
    consumer_user = db.query(models.User).filter(models.User.email == "consumer@test.com").first()
    rice_product = db.query(models.Product).filter(models.Product.name == "Bag of Rice (50kg)").first()
    
    if consumer_user and rice_product:
        if not db.query(models.Review).filter(models.Review.user_id == consumer_user.id, models.Review.product_id == rice_product.id).first():
            db.add(models.Review(rating=4, comment="Good quality rice, cooks well.", user_id=consumer_user.id, product_id=rice_product.id))
            db.commit()
    
    print("\n✅ Seeding complete!")

finally:
    db.close()