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

@app.post("/upload/asset/")
def upload_asset(upload: schemas.AssetUpload):
    import base64
    import os
    import time
    import re
    
    folder = "gallery"
    if upload.id.startswith("sys-") or upload.id.startswith("player-"):
        folder = "identity"
    elif upload.id.startswith("proj-"):
        folder = "projects"
    elif upload.id.startswith("asset-"):
        parts = upload.id.split("-")
        if len(parts) >= 2:
            folder = parts[1]
        
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "agent-app", "src", "assets", folder)
    os.makedirs(assets_dir, exist_ok=True)
    
    match = re.match(r"^data:([A-Za-z-+/\.]+);base64,(.+)$", upload.dataUrl)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid input string")
        
    ext = match.group(1).split("/")[1] if "/" in match.group(1) else "webp"
    buffer = base64.b64decode(match.group(2))
    
    filename = f"{upload.id}-{int(time.time()*1000)}.{ext}"
    filepath = os.path.join(assets_dir, filename)
    
    with open(filepath, "wb") as f:
        f.write(buffer)
        
    # Return the relative Vite path so the browser can load it correctly
    return {"url": f"/src/assets/{folder}/{filename}"}

@app.get("/assets/list")
def list_assets():
    import os
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "agent-app", "src", "assets")
    
    files_by_folder = {}
    if os.path.exists(assets_dir):
        for root, dirs, files in os.walk(assets_dir):
            if "node_modules" in root or ".git" in root:
                continue
            
            rel_path = os.path.relpath(root, assets_dir)
            if rel_path == ".":
                folder_key = "root"
            else:
                folder_key = rel_path.replace("\\", "/")
                
            file_list = []
            for f in files:
                if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
                    file_list.append(f"/src/assets/{folder_key}/{f}" if folder_key != "root" else f"/src/assets/{f}")
            
            if file_list:
                files_by_folder[folder_key] = file_list
                
    return files_by_folder

@app.get("/proxy/yfinance/{symbol}")
def proxy_yfinance(symbol: str):
    import urllib.request
    import json
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.put("/agents/{agent_id}", response_model=schemas.Agent)
def update_agent(agent_id: str, agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = crud.update_agent(db, agent_id=agent_id, agent=agent)
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent

@app.delete("/agents/{agent_id}", response_model=schemas.Agent)
def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    db_agent = crud.delete_agent(db, agent_id=agent_id)
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent

@app.get("/projects/", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_projects(db, skip=skip, limit=limit)

@app.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db=db, project=project)

@app.put("/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: str, project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_proj = crud.update_project(db, project_id=project_id, project=project)
    if db_proj is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_proj

@app.delete("/projects/{project_id}", response_model=schemas.Project)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    db_proj = crud.delete_project(db, project_id=project_id)
    if db_proj is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_proj

@app.get("/holdings/", response_model=List[schemas.Holding])
def read_holdings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_holdings(db, skip=skip, limit=limit)

@app.post("/holdings/", response_model=schemas.Holding)
def create_holding(holding: schemas.HoldingCreate, db: Session = Depends(get_db)):
    return crud.create_holding(db=db, holding=holding)

@app.delete("/holdings/{symbol}", response_model=schemas.Holding)
def delete_holding(symbol: str, db: Session = Depends(get_db)):
    db_holding = crud.delete_holding(db, symbol=symbol)
    if db_holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    return db_holding

@app.get("/settings/", response_model=List[schemas.Setting])
def read_settings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_settings(db, skip=skip, limit=limit)

@app.post("/settings/", response_model=schemas.Setting)
def create_setting(setting: schemas.SettingCreate, db: Session = Depends(get_db)):
    return crud.create_setting(db=db, setting=setting)

@app.delete("/settings/{key}", response_model=schemas.Setting)
def delete_setting(key: str, db: Session = Depends(get_db)):
    db_setting = crud.delete_setting(db, key=key)
    if db_setting is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return db_setting
