from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import models
from app.routes import locations, auth, products, favorites, reviews, users, shopping_list, stores, inventory, analytics

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Neighbour API")

origins = [
    "http://localhost:5173",          # For the web-dashboard
    "http://localhost:8081",          # For Expo Web running locally
    "https://sznx9oc-anonymous-8081.exp.direct" # The Expo Go tunnel URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)


app.include_router(locations.router)
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(favorites.router)
app.include_router(reviews.router)
app.include_router(users.router)
app.include_router(shopping_list.router)
app.include_router(stores.router) 
app.include_router(inventory.router)
app.include_router(analytics.router)

@app.get("/", tags=["Root"])
def read_root():
    return {"status": "ok", "message": "Welcome to the Neighbor API! Database tables are set up."}
