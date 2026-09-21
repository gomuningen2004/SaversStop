from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class DebtInteractionCreate(BaseModel):
    person_id: UUID
    interaction_date: datetime
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    type: str
    reason: str | None = None


class DebtInteractionUpdate(BaseModel):
    person_id: UUID | None = None
    interaction_date: datetime | None = None
    amount: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )
    type: str | None = None
    reason: str | None = None


class DebtInteractionResponse(BaseModel):
    id: UUID
    person_id: UUID
    interaction_date: datetime
    amount: Decimal
    type: str
    reason: str | None
    created_at: datetime
    updated_at: datetime
