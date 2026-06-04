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
