from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class TransactionType(str, Enum):
    SENT = "sent"
    RECEIVED = "received"


class TransactionCreate(BaseModel):
    transaction_date: datetime
    reason: str | None = Field(default=None, max_length=255)
    category_id: UUID | None = None
    account_id: UUID
    amount: Decimal = Field(gt=0)
    type: TransactionType


class TransactionUpdate(BaseModel):
    transaction_date: datetime | None = None
    reason: str | None = Field(default=None, max_length=255)
    category_id: UUID | None = None
    account_id: UUID | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    type: TransactionType | None = None


class TransactionResponse(BaseModel):
    id: UUID
    transaction_date: datetime
    reason: str | None
    category_id: UUID | None
    account_id: UUID
    amount: Decimal
    type: TransactionType
    transfer_id: UUID | None
    created_at: datetime
    updated_at: datetime
