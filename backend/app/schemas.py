from pydantic import BaseModel, EmailStr
from typing import Optional
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
    
    
class User(UserBase):
    id: int
    is_active: bool
    
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
    class Config: from_attributes = True
    
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
    
    class Config:
        from_attributes = True
    
class StoreSimple(BaseModel):
    id: int
    name: str
    market_area: str
    city: str

    class Config: from_attributes = True