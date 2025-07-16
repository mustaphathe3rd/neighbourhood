from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..models import models 
from ..database import SessionLocal, get_db
from ..utils.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("/", response_model=schemas.Review)
def submit_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    print("--- SUBMIT REVIEW ROUTE HIT ---")
    print(f"--- BODY RECEIVED: {review.model_dump_json()} ---")
    
    # We will hardcode the user_id to 1 for this test
    user_id_for_test = 1
    
    return crud.create_review(db=db, review=review, user_id=current_user.id)
    

@router.get("/product/{product_id}", response_model=List[schemas.Review])
def read_reviews(product_id: int, db:Session = Depends(get_db)):
    return crud.get_reviews_for_product(db=db, product_id=product_id)
