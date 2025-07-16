# backend/app/routes/favorites.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..models import models 
from ..database import SessionLocal, get_db
from ..utils.auth import get_current_user


router = APIRouter(
    prefix="/favorites",
    tags=["favorites"]
)


@router.get("/stores", response_model=List[schemas.StoreSimple])
def read_favorite_stores(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # This now works because the CRUD function returns SQLAlchemy objects
    # that match what the response_model expects.
    return crud.get_favorite_stores(db=db, user_id=current_user.id)

@router.post("/stores/{store_id}", response_model=schemas.StoreSimple)
def favorite_a_store(
    store_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # The CRUD function now returns the added store or None
    added_store = crud.add_favorite_store(db=db, user_id=current_user.id, store_id=store_id)
    if added_store is None:
        raise HTTPException(status_code=404, detail="Store not found or already in favorites.")
    return added_store

@router.delete("/stores/{store_id}")
def unfavorite_a_store(
    store_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    success = crud.remove_favorite_store(db=db, user_id=current_user.id, store_id=store_id)
    if not success:
        raise HTTPException(status_code=404, detail="Store not found in favorites.")
    return {"status": "success", "message": "Store removed from favorites"}