# backend/app/routes/stores.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..models import models
from ..database import get_db
from ..utils.auth import get_current_user

router = APIRouter(
    prefix="/stores",
    tags=["stores"]
)

def get_current_user_with_store_owner_role(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "store_owner":
        raise HTTPException(status_code=403, detail="Only users with role 'store_owner' can create a store.")
    return current_user


@router.post("/", response_model=schemas.StoreSimple)
def create_store(
    store: schemas.StoreCreate,
    db: Session = Depends(get_db),
    # Use the new, simpler dependency that ONLY checks the role
    current_user: models.User = Depends(get_current_user_with_store_owner_role)
):
    if current_user.store:
        raise HTTPException(status_code=400, detail="User already owns a store")
    
    return crud.create_store_for_user(db=db, store_data=store, user_id=current_user.id)