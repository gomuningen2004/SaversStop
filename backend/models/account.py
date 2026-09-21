from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class AccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    account_type_id: UUID
    current_balance: Decimal = Field(default=Decimal("0.00"))
    active: bool = True


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    account_type_id: UUID | None = None
    current_balance: Decimal | None = None
    active: bool | None = None


class AccountResponse(BaseModel):
    id: UUID
    name: str
    account_type_id: UUID
    current_balance: Decimal
    active: bool
