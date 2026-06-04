from pydantic import BaseModel
from typing import Optional

class AgentBase(BaseModel):
    name: str
    roleEn: str
    roleTh: str
    rarity: str
    seniority: str
    status: Optional[str] = "idle"
    lv: Optional[int] = 1
    salary: Optional[float] = 0.5
    desc: str
    model: Optional[str] = "sonnet"
    skillMd: Optional[str] = ""

class AgentCreate(AgentBase):
    id: str

class Agent(AgentBase):
    id: str

    class Config:
        orm_mode = True
        from_attributes = True
