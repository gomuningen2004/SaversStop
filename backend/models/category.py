from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    active: bool = True


class CategoryUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    active: bool | None = None


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    active: bool
    created_at: datetime
    updated_at: datetime
