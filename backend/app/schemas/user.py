from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str
    is_active: bool


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "client"
    is_active: bool = True


class UserUpdate(BaseModel):
    username: str
    email: EmailStr
    role: str = "client"
    is_active: bool = True
    password: str | None = None


class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
