
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..models import models
from ..database import get_db
from pydantic import BaseModel 
from ..utils.auth import get_current_user

router = APIRouter(prefix="/list", tags=["shopping-list"])

class ListItemUpdate(BaseModel):
    quantity: int

@router.get("/", response_model=schemas.ShoppingList)
def get_user_shopping_list(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    shopping_list = crud.get_or_create_shopping_list(db, user_id=current_user.id)

    for item in shopping_list.items:
        print(f"Product {item.product.name} image_url: {item.product.image_url}")
        
    total_price = sum(item.price_at_addition * item.quantity for item in shopping_list.items)

    formatted_items = [
        {
            "id": item.id, "product_id": item.product.id, "quantity": item.quantity,
            "product_name": item.product.name, "store_id": item.store.id,
            "store_name": item.store.name, "price_at_addition": item.price_at_addition,
            "image_url": item.product.image_url
        } for item in shopping_list.items
    ]
    return {"id": shopping_list.id,"items": formatted_items, "total_price": total_price}

@router.post("/items", response_model=schemas.ListItem)
def add_product_to_list(
    item_data: schemas.ListItemCreate,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    shopping_list = crud.get_or_create_shopping_list(db, user_id=current_user.id)
    item = crud.add_item_to_list(db, list_id=shopping_list.id, item_data=item_data)

    # Format and return the added item
    return {
        "id": item.id, "product_id": item.product.id, "quantity": item.quantity,
        "product_name": item.product.name, "store_id": item.store.id,
        "store_name": item.store.name, "price_at_addition": item.price_at_addition
    }

@router.put("/items/{item_id}")
def update_shopping_list_item_quantity(
    item_id: int,
    item_data: ListItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # We can add logic here to ensure the user owns this shopping list item
    crud.update_item_quantity(db=db, item_id=item_id, quantity=item_data.quantity)
    return {"status": "success"}

@router.delete("/items/{item_id}")
def remove_shopping_list_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    crud.remove_list_item(db=db, item_id=item_id)
    return {"status": "success"}