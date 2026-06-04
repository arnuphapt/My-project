from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import SessionLocal, engine, get_db

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Office AI API", version="1.0.0")

# Add CORS middleware to allow React app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origin (e.g., "http://localhost:5173")
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Office AI API!"}

@app.get("/agents/", response_model=List[schemas.Agent])
def read_agents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    agents = crud.get_agents(db, skip=skip, limit=limit)
    return agents

@app.post("/agents/", response_model=schemas.Agent)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = crud.get_agent(db, agent_id=agent.id)
    if db_agent:
        raise HTTPException(status_code=400, detail="Agent ID already exists")
    return crud.create_agent(db=db, agent=agent)

@app.get("/projects/", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_projects(db, skip=skip, limit=limit)

@app.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db=db, project=project)

@app.get("/holdings/", response_model=List[schemas.Holding])
def read_holdings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_holdings(db, skip=skip, limit=limit)

@app.post("/holdings/", response_model=schemas.Holding)
def create_holding(holding: schemas.HoldingCreate, db: Session = Depends(get_db)):
    return crud.create_holding(db=db, holding=holding)

@app.get("/settings/", response_model=List[schemas.Setting])
def read_settings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_settings(db, skip=skip, limit=limit)

@app.post("/settings/", response_model=schemas.Setting)
def create_setting(setting: schemas.SettingCreate, db: Session = Depends(get_db)):
    return crud.create_setting(db=db, setting=setting)
