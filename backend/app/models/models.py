from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime,TIMESTAMP, Boolean, Text, func, Table
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from ..database import Base


#This is an association table for the many-to-many relationship
# between users and their favourite stores.
favorite_stores_table = Table('favorite_stores', Base.metadata,
        Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
        Column('store_id', Integer, ForeignKey('stores.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, nullable=False)
    shopping_list = relationship("ShoppingList", back_populates="user", uselist=False, cascade="all, delete-orphan")
    favorite_stores = relationship("Store", secondary=favorite_stores_table, back_populates="favorited_by_users")

    store = relationship("Store", back_populates="owner", uselist=False)
    reviews = relationship("Review", back_populates="user")

class Store(Base):
    __tablename__ = "stores"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    market_area_id = Column(Integer, ForeignKey("market_areas.id"))
    
    # Add this corresponding relationship
    favorited_by_users = relationship("User", secondary=favorite_stores_table, back_populates="favorite_stores")
    
    owner = relationship("User", back_populates="store")
    market_area = relationship("MarketArea", back_populates="stores")
    prices = relationship("Price", back_populates="store")
    
class MarketArea(Base):
    __tablename__ = "market_areas"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(Geometry(geometry_type='POINT', srid=4326), index=True)
    city_id = Column(Integer, ForeignKey("cities.id"))
    
    city = relationship("City", back_populates="market_areas")
    stores = relationship("Store", back_populates="market_area")
    
class City(Base):
    __tablename__ = "cities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    state_id = Column(Integer, ForeignKey("states.id"))

    state = relationship("State", back_populates="cities")
    market_areas = relationship("MarketArea", back_populates="city")

class State(Base):
    __tablename__ = "states"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    cities = relationship("City", back_populates="state")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    barcode = Column(String, unique=True, index=True, nullable=True)
    category = Column(String, index=True)
    
    shopping_list_items = relationship("ShoppingListItem", back_populates="product")
    prices = relationship("Price", back_populates="product")
    reviews = relationship("Review", back_populates="product")

class Price(Base):
    __tablename__ ="prices"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))
    price = Column(Float, nullable=False)
    stock_level = Column(Integer, default=2, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    
    product = relationship("Product", back_populates="prices")
    store = relationship("Store", back_populates="prices")
    
class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    timestamp = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    
    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")
    
class ShoppingList(Base):
    __tablename__ = "shopping_lists"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    user = relationship("User", back_populates="shopping_list")
    items = relationship("ShoppingListItem", back_populates="shopping_list", cascade="all, delete-orphan")
    
class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"
    id = Column(Integer, primary_key=True, index=True)
    shopping_list_id = Column(Integer, ForeignKey("shopping_lists.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    store_id = Column(Integer, ForeignKey("stores.id")) # <-- ADD THIS
    quantity = Column(Integer, default=1)
    price_at_addition = Column(Float, nullable=False) # <-- ADD THIS

    shopping_list = relationship("ShoppingList", back_populates="items")
    product = relationship("Product", back_populates="shopping_list_items")
    store = relationship("Store") # <-- ADD THIS