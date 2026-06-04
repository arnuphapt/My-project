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
