from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class AccountClassification(str, Enum):
    ASSET = "asset"
    LIABILITY = "liability"


class AccountTypeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    classification: AccountClassification
    active: bool = True


class AccountTypeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    classification: AccountClassification | None = None
    active: bool | None = None


class AccountTypeResponse(BaseModel):
    id: UUID
    name: str
    classification: AccountClassification
    active: bool
    created_at: datetime
    updated_at: datetime
