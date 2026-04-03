from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import math
from typing import List, Optional

app = FastAPI(title="SurakshaPay Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "surakshapay.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            work_hours INTEGER,
            daily_earnings REAL,
            weekly_income REAL,
            selected_plan TEXT,
            calculated_premium REAL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            plan_name TEXT,
            coverage_factor REAL,
            weekly_premium REAL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

class UserRegistration(BaseModel):
    fullName: str
    phone: str
    workHours: int
    dailyEarnings: float
    selectedPlan: str

class CalculationResult(BaseModel):
    premium: float
    expectedLoss: float
    payoutIfTriggered: float

@app.get("/")
def read_root():
    return {"message": "SurakshaPay API is running. Access /docs for Swagger UI."}

@app.post("/api/calculate_premium", response_model=CalculationResult)
def calculate_premium(req: UserRegistration):
    # Formula: P_w = (L_w × p × α) + (σ × β) + M
    # L_w = Avg Hourly Income × Hours Lost per Event × Events per Week
    avg_hourly_income = req.dailyEarnings / max(req.workHours, 1)
    
    hours_lost_per_event = 4.0
    events_per_week = 1.5
    L_w = avg_hourly_income * hours_lost_per_event * events_per_week
    
    p = 0.3 # Probability of disruption
    
    alpha_map = {
        "basic": 0.6,
        "standard": 0.7,
        "pro": 0.85
    }
    alpha = alpha_map.get(req.selectedPlan.lower(), 0.7)
    
    sigma = 269.0 # Volatility
    beta = 0.2
    M = 10.0 # Margin
    
    P_w = (L_w * p * alpha) + (sigma * beta) + M
    P_w = round(P_w, 2)
    
    expectedLoss = round(L_w, 2)
    payoutIfTriggered = round(L_w * alpha, 2)
    
    return CalculationResult(
        premium=P_w,
        expectedLoss=expectedLoss,
        payoutIfTriggered=payoutIfTriggered
    )

@app.post("/api/register")
def register_user(req: UserRegistration):
    calc = calculate_premium(req)
    premium = calc.premium
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Insert user
    cursor.execute('''
        INSERT INTO users (full_name, phone, work_hours, daily_earnings, weekly_income, selected_plan, calculated_premium)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (req.fullName, req.phone, req.workHours, req.dailyEarnings, req.dailyEarnings * 6, req.selectedPlan, premium))
    
    user_id = cursor.lastrowid
    
    alpha_map = {"basic": 0.6, "standard": 0.7, "pro": 0.85}
    alpha = alpha_map.get(req.selectedPlan.lower(), 0.7)
    
    # Insert policy
    cursor.execute('''
        INSERT INTO policies (user_id, plan_name, coverage_factor, weekly_premium)
        VALUES (?, ?, ?, ?)
    ''', (user_id, req.selectedPlan, alpha, premium))
    
    conn.commit()
    conn.close()
    
    return {"message": "User and policy registered", "user_id": user_id, "premium": premium}

@app.get("/api/user/{user_id}")
def get_user(user_id: int):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)
