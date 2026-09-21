from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class TransferCreate(BaseModel):
    transfer_date: datetime
    source_account_id: UUID
    destination_account_id: UUID
    amount: Decimal = Field(gt=0)
    reason: str | None = Field(default=None, max_length=255)


class TransferUpdate(BaseModel):
    transfer_date: datetime | None = None
    source_account_id: UUID | None = None
    destination_account_id: UUID | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    reason: str | None = Field(default=None, max_length=255)


class TransferResponse(BaseModel):
    id: UUID
    transfer_date: datetime
    created_at: datetime
    updated_at: datetime
