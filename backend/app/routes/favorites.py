from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from .. import models
from ..models import models
from ..database import SessionLocal
from ..utils.auth import get_current_user

router = APIRouter(prefix="/favorites", tags=["favorites"])
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
    

@router.post("/stores/{store_id}", response_model=schemas.User)
def favorite_a_store(store_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.add_favorite_store(db=db, user_id=current_user.id, store_id=store_id)

@router.delete("/stores/{store_id}", response_model=schemas.User)
def unfavorite_a_store(store_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.remove_favorite_store(db=db, user_id=current_user.id, store_id=store_id)

@router.get("/stores", response_model=List[schemas.StoreSimple])
def read_favorite_stores(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_favorite_stores(db=db, user_id=current_user.id)