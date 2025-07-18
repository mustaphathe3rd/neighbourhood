from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..models import models
from ..database import get_db
from..utils.auth import get_current_store_owner

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"]
)

@router.get("/", response_model=List[schemas.Price])
def get_store_inventory(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_store_owner)
):
    # The dependency ensures only a store owner can access this.
    # It then fetches all prices associated with that owner's store.
    return crud.get_prices_for_store(db, store_id=current_user.store.id)

@router.post("/", response_model=schemas.Price, status_code=201)
def add_price_to_inventory(
    price_data: schemas.PriceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner)
):
    return crud.create_price_for_store(db, store_id=current_user.store.id, price_data=price_data)

# --- ADD THIS NEW ENDPOINT ---
@router.put("/{price_id}", response_model=schemas.Price)
def update_price_in_inventory(
    price_id: int,
    price_data: schemas.PriceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner)
):
    db_price = crud.get_price_by_id(db, price_id=price_id)
    if not db_price or db_price.store_id != current_user.store.id:
        raise HTTPException(status_code=404, detail="Price entry not found or you do not own it.")
    
    return crud.update_price(db, price_id=price_id, price_data=price_data)

# --- ADD THIS NEW ENDPOINT ---
@router.delete("/{price_id}", status_code=204)
def remove_price_from_inventory(
    price_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner)
):
    db_price = crud.get_price_by_id(db, price_id=price_id)
    if not db_price or db_price.store_id != current_user.store.id:
        raise HTTPException(status_code=404, detail="Price entry not found or you do not own it.")

    crud.delete_price(db, price_id=price_id)
    return