# backend/app/routes/products.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/search", response_model=List[schemas.PriceSearchResult])
def search_for_products_prices(q: str, city_id: int,sort_by: Optional[str] = "price_asc", db: Session = Depends(get_db)):
    results = crud.search_prices_for_product(db=db, query=q, city_id=city_id, sort_by=sort_by)
    # The 404 is now handled by the frontend if the list is empty
    return results

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
def read_product_prices(product_id: int,city_id: int, db: Session = Depends(get_db)):
    prices = crud.get_prices_for_product(db=db, product_id=product_id, city_id=city_id)
    if not prices:
        raise HTTPException(status_code=404, detail="No prices found for this product.")
    return prices