from ..models import models
from fastapi import APIRouter, Depends
from .. import schemas
from ..utils.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    An endpoint to test authentication. Returns the current user.
    """
    return schemas.User.model_validate(current_user)