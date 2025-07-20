import json
from app.database import SessionLocal, engine
from app.models import models
from geoalchemy2.elements import WKTElement
from shapely.geometry import shape # Ensure shapely is imported

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    print("Loading GeoJSON data from geoBoundaries-NGA-ADM1.geojson...")
    # Make sure your file is named geoBoundaries-NGA-ADM1.geojson
    with open('nga.geojson', 'r') as f:
        data = json.load(f)

    print("Importing state boundaries...")
    for feature in data['features']:
        state_name = feature['properties']['shapeName'] # The key is 'shapeName' in this file
        geometry = feature['geometry']
        
        if not db.query(models.StateBoundary).filter(models.StateBoundary.state_name == state_name).first():
            geom_shape = shape(geometry)
            
            # --- THIS IS THE FIX ---
            # Simplify the geometry to reduce its complexity and data size.
            # The '0.01' is the tolerance; a higher number means more simplification.
            simplified_geom = geom_shape.simplify(0.05, preserve_topology=True)
            
            boundary = models.StateBoundary(
                state_name=state_name,
                geom=WKTElement(simplified_geom.wkt, srid=4326)
            )
            db.add(boundary)
            print(f"  + Added {state_name}")

    db.commit()
    print("Boundary import complete! 🗺️")

finally:
    db.close()
