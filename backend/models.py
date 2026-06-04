from sqlalchemy import Column, Integer, String, Float
from database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    roleEn = Column(String)
    roleTh = Column(String)
    rarity = Column(String)
    seniority = Column(String)
    status = Column(String, default="idle")
    lv = Column(Integer, default=1)
    salary = Column(Float, default=0.5)
    desc = Column(String)
    model = Column(String, default="sonnet")
    skillMd = Column(String)

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    role = Column(String)
    status = Column(String)
    progress = Column(Integer)
    period = Column(String)
    tags = Column(String)
    cover = Column(String)
    summary = Column(String)
    highlights = Column(String)

class Holding(Base):
    __tablename__ = "holdings"
    symbol = Column(String, primary_key=True, index=True)
    name = Column(String)
    cls = Column(String)
    cur = Column(String)
    avgPrice = Column(Float)
    amount = Column(Float)

class Setting(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String)
