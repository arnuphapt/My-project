from sqlalchemy.orm import Session
import models, schemas

def get_agents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Agent).offset(skip).limit(limit).all()

def get_agent(db: Session, agent_id: str):
    return db.query(models.Agent).filter(models.Agent.id == agent_id).first()

def create_agent(db: Session, agent: schemas.AgentCreate):
    db_agent = models.Agent(**agent.model_dump())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    db_proj = models.Project(**project.model_dump())
    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    return db_proj

def get_holdings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Holding).offset(skip).limit(limit).all()

def create_holding(db: Session, holding: schemas.HoldingCreate):
    db_holding = models.Holding(**holding.model_dump())
    db.merge(db_holding) # Merge handles insert or update on primary key
    db.commit()
    return db_holding

def get_settings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Setting).offset(skip).limit(limit).all()

def create_setting(db: Session, setting: schemas.SettingCreate):
    db_setting = models.Setting(**setting.model_dump())
    db.merge(db_setting) # Upsert
    db.commit()
    return db_setting
