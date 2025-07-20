# Neighbor: Hyper-Local Price Comparison

Neighbor is a community-driven platform designed to bring price transparency to Nigerian markets. It empowers consumers to find the best prices for everyday goods in their immediate vicinity while enabling local vendors to compete in a fair, digital marketplace.

This repository contains the complete monorepo for the Neighbor ecosystem, including:

* `backend/`: A high-performance FastAPI server with a PostgreSQL/PostGIS database.
* `mobile-app/`: A React Native (Expo) application for consumers.
* `web-dashboard/`: A React + Vite application for store owners.

---

## Core Features

### Consumer Mobile App:
* GPS and manual location-based product search.
* Dynamic search radius control.
* Advanced search with sorting by price, distance, and rating.
* Real-time price comparison display.
* Store information with map-based directions.
* User-submitted reviews and ratings.
* Personal shopping list with a total price calculator.

### Store Web Dashboard:
* Secure registration and login for store owners.
* Store profile creation and location management.
* Full inventory management (CRUD for prices).
* Basic analytics on product views.

---

## Tech Stack

| Component | Technology |
|---|---|
| **Mobile App** | React Native (Expo), TypeScript, TanStack Query |
| **Web Dashboard** | React, Vite, Tailwind CSS |
| **Backend API** | FastAPI (Python), SQLAlchemy |
| **Database** | PostgreSQL with PostGIS |
| **Authentication** | JWT (JSON Web Tokens) |

---

## Setup & Installation Instructions

### Prerequisites
* Node.js (v18+)
* Python (v3.8+)
* PostgreSQL (v14+) with the PostGIS extension enabled
* Git

---
First clone the repo with command:
```bash
git clone https://github.com/mustaphathe3rd/neighbourhood.git
```

---

### 1. Backend Setup
The backend server powers the entire application.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# .\\venv\\Scripts\\activate  # On Windows

# 3. Install dependencies
pip install -r requirements.txt # You would create this file with pip freeze > requirements.txt

# 4. Set up your database
#    - Create a database named 'neighbor_db' and a user/password.
#    - Enable the PostGIS extension: CREATE EXTENSION postgis;

# 5. Configure environment variables
#    - Copy .env.example to .env and fill in your database URL and JWT secret key.

# 6. Run the database setup and seeding script
#    - This creates all tables and populates them with sample data.
python seed.py

# 7. Start the development server
uvicorn main:app --reload --host 0.0.0.0
 ```

The API will be running at `http://localhost:8000`.

---

### 2. Web Dashboard Setup (for Store Owners)
The web app for store owners to manage their inventory.

```bash
# 1. Navigate to the web dashboard directory
cd web-dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

```
The dashboard will be running at `http://localhost:5173`.

---

### 3. Mobile App Setup (for Consumers)
The main consumer-facing application.

```bash
# 1. Navigate to the mobile app directory
cd mobile-app

# 2. Install dependencies
npm install

# 3. Start the Expo development server
npx expo start

```

The dashboard will be running at `http://localhost:5173`.

Scan the QR code with the Expo Go app on your iOS or Android device to run the app.


--- 
Alternatively and preferably use a ngrok server (to ensure seamless connection with the mobile device) to host the backend server that is running on port 8000 by running the command:

 ``` bash
 ngrok http 800
 ```
 then attach the url in this format to the API_BASE_URL constant in **neighbourhood/mobile-app/mobile-app/src/api/client.ts**
 ```bash
 # Ensure that your backend server is running on port 8000
 # The ngrok url is of this format
 
 https://3f7499b3f1c6.ngrok-free.app
 
 # Note: You have to change the API_BASE_URL constant each time you restart the ngrok server!!
 ```
