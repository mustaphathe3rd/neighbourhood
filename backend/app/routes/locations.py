# backend/app/routes/locations.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import SessionLocal, get_db
from typing import List

router = APIRouter(
    prefix="/locations",
    tags=["locations"]
)

@router.get("/markets/nearby", response_model=List[schemas.MarketArea])
def read_nearby_markets(lat: float, lon: float, radius_km: int = 5, db: Session = Depends(get_db)):
    """
    Get a list of market areas near a specific latitude and longitude.
    Example: /locations/markets/nearby?lat=4.83&lon=7.05
    """
    db_markets = crud.get_markets_near_location(db=db, lat=lat, lon=lon, radius_km=radius_km)
    
    # Customizing the response to match our Pydantic schema
    response_markets = []
    for market in db_markets:
        response_markets.append({
            "id": market.id,
            "name": market.name,
            "city_name": market.city.name,
            "state_name": market.city.state.name
        })

    return response_markets

@router.get("/states", response_model=List[schemas.State])
def read_states(db: Session = Depends(get_db)):
    return crud.get_states(db=db)

@router.get("/cities/{state_id}", response_model=List[schemas.City])
def read_cities_for_state(state_id: int, db: Session = Depends(get_db)):
    return crud.get_cities_by_state(db=db, state_id=state_id)

@router.get("/markets/{city_id}", response_model=List[schemas.MarketAreaSimple])
def read_markets_for_city(city_id: int, db: Session = Depends(get_db)):
    return crud.get_markets_by_city(db=db, city_id=city_id)