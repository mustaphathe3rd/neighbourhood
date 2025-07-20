from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List
from datetime import datetime


class MarketAreaBase(BaseModel):
    name: str
    
class MarketAreaCreate(MarketAreaBase):
    pass

class MarketArea(MarketAreaBase):
    id: int
    city_name: str 
    state_name: str
    
    class Config:
        from_attributes = True
        
class UserBase(BaseModel):
    email: EmailStr
    role: str
    name: str
    
class UserCreate(UserBase):
    password: str
    
class StoreSimple(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True
        
class StoreCreate(BaseModel):
    name: str
    market_area_id: int
        
class User(UserBase):
    id: int
    is_active: bool
    store: Optional[StoreSimple] = None # This allows the user's 
    
    class Config:
        from_attributes = True
        
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    email: Optional[str] = None
    
class State(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True

class City(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True

class MarketAreaSimple(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True
    
class Product(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    class Config: from_attributes = True
    
class PriceBase(BaseModel):
    price: float
    stock_level: int

# --- THIS IS THE MISSING SCHEMA ---
class Price(PriceBase):
    id: int
    product: Product # This nests the product information in the response

    class Config:
        from_attributes = True
    
class PriceSearchResult(BaseModel):
    product_id: int
    product_name: str
    price: float
    store_id: int
    store_name: str
    market_area: str
    city: str
    state: str
    timestamp: datetime
    stock_level: int
    avg_rating: Optional[float] = None
    distance_km: Optional[float] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    image_url: Optional[str] = None
    is_out_of_state: Optional[bool] = None
    
    class Config:
        from_attributes = True
    
class UserInReview(BaseModel):
    name: str
    class Config: from_attributes = True
    
CommentStr = constr(max_length=500)
    
class ReviewBase(BaseModel):
    rating: int
    comment: Optional[constr(max_length=500)] = None
    
class ReviewCreate(ReviewBase):
    product_id: int
    
class Review(ReviewBase):
    id: int
    timestamp: datetime
    user: UserInReview # Nest user info

    class Config:
        from_attributes = True
    
class ListItemCreate(BaseModel):
    product_id: int
    store_id: int
    price: float
    

class ListItem(BaseModel):
    id: int
    product_id: int
    quantity: int
    product_name: str
    store_name: str
    price_at_addition: float
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class ShoppingList(BaseModel):
    id: int
    items: List[ListItem] = []
    total_price: float = 0.0

    class Config:
        from_attributes = True
        
class PriceBase(BaseModel):
    price: float
    stock_level: int

# Add this class for creating new price entries
class PriceCreate(PriceBase):
    product_id: int

# Add this class for updating existing price entries
class PriceUpdate(PriceBase):
    pass

class ProductViewLog(BaseModel):
    product_id: int
    store_id: int

class AnalyticsResult(BaseModel):
    product_name: str
    view_count: int