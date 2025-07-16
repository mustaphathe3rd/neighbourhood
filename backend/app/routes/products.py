# backend/app/routes/products.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas
from ..database import SessionLocal, get_db

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

@router.get("/search", response_model=List[schemas.PriceSearchResult])
def search_all_products(
    db: Session = Depends(get_db),
    q: str = "",
    sort_by: Optional[str] = "price_asc",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius_km: Optional[int] = None,
    city_id: Optional[int] = None
):
    # This now correctly passes all optional params to the CRUD function
    return crud.unified_search(
        db=db, 
        query=q, 
        sort_by=sort_by, 
        lat=lat, 
        lon=lon, 
        radius_km=radius_km, 
        city_id=city_id
    )

@router.get("/barcode/{barcode}", response_model=schemas.Product)
def get_product_by_barcode(barcode: str, db: Session = Depends(get_db)):
    """
    Look up a product by its barcode.
    Example: /products/barcode/615104020202
    """
    db_product = crud.get_product_by_barcode(db=db, barcode=barcode)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product with this barcode not found.")
    return db_product

@router.get("/{product_id}/prices", response_model=List[schemas.PriceSearchResult])
def read_product_prices(
    product_id: int, 
    db: Session = Depends(get_db),
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius_km: Optional[int] = None,
    city_id: Optional[int] = None
):
    prices = crud.get_prices_for_product(
        db=db, product_id=product_id, lat=lat, lon=lon, city_id=city_id
    )
    if not prices:
        raise HTTPException(status_code=404, detail="No prices found for this product in the specified location.")
    return prices