from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..models import models
from ..database import get_db
from ..utils.auth import get_current_store_owner

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.post("/log-view", status_code=204)
def log_a_product_view(view_data: schemas.ProductViewLog, db: Session = Depends(get_db)):
    # This is a public endpoint that the mobile app will call
    crud.log_product_view(db, view_data=view_data)
    return

@router.get("/views", response_model=List[schemas.AnalyticsResult])
def get_store_view_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_store_owner)):
    # This is a protected endpoint for the store owner's dashboard
    return crud.get_view_counts_for_store(db, store_id=current_user.store.id)