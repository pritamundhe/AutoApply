from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- Pydantic Models ---

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Education(BaseModel):
    degree: Optional[str] = ""
    institution: Optional[str] = ""

class MemoryItem(BaseModel):
    label: str
    value: str
    count: int = 1
    lastUsed: datetime = Field(default_factory=datetime.utcnow)

class ProfileUpdate(BaseModel):
    fullName: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    currentTitle: Optional[str] = ""
    yearsOfExperience: Optional[str] = ""
    skills: Optional[List[str]] = []
    education: Optional[Education] = Education()
    linkedinUrl: Optional[str] = ""
    portfolioUrl: Optional[str] = ""
    summary: Optional[str] = ""
    completionStep: Optional[int] = 0

class MemoryRequest(BaseModel):
    fields: List[dict] # list of {"label": "...", "value": "..."}

class AIFieldReq(BaseModel):
    id: str
    label: str
    type: str
    placeholder: Optional[str] = ""
    section: Optional[str] = ""
    autocomplete: Optional[str] = ""
    options: Optional[List[dict]] = None

class AIMapRequest(BaseModel):
    fields: List[AIFieldReq]
    profile: dict
    pageContext: Optional[dict] = {}

class ChatUpdateRequest(BaseModel):
    message: str
    currentProfile: dict
