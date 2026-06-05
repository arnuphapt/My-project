from pydantic import BaseModel
from typing import Optional, List

class AssetUpload(BaseModel):
    id: str
    dataUrl: str

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

class ProjectBase(BaseModel):
    title: str
    role: str
    status: str
    progress: int
    period: str
    tags: str
    cover: str
    summary: str
    highlights: str

class ProjectCreate(ProjectBase):
    id: str

class Project(ProjectBase):
    id: str
    class Config:
        from_attributes = True

class HoldingBase(BaseModel):
    name: str
    cls: str
    cur: str
    avgPrice: float
    amount: float

class HoldingCreate(HoldingBase):
    symbol: str

class Holding(HoldingBase):
    symbol: str
    class Config:
        from_attributes = True

class SettingBase(BaseModel):
    value: str

class SettingCreate(SettingBase):
    key: str

class Setting(SettingBase):
    key: str
    class Config:
        from_attributes = True
