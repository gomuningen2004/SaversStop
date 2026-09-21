from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)

    account_id: UUID

    target_amount: Decimal = Field(..., gt=0)

    saved_amount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    monthly_contribution: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    target_date: date

    status: str = Field(default="active")

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Goal name cannot be empty.")

        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in {"active", "completed"}:
            raise ValueError("Status must be either 'active' or 'completed'.")

        return value


class GoalUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    account_id: UUID | None = None

    target_amount: Decimal | None = Field(
        default=None,
        gt=0,
    )

    saved_amount: Decimal | None = Field(
        default=None,
        ge=0,
    )

    monthly_contribution: Decimal | None = Field(
        default=None,
        ge=0,
    )

    target_date: date | None = None

    status: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("Goal name cannot be empty.")

        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return None

        if value not in {"active", "completed"}:
            raise ValueError("Status must be either 'active' or 'completed'.")

        return value


class GoalContribution(BaseModel):
    amount: Decimal = Field(..., gt=0)


class GoalResponse(BaseModel):
    id: UUID
    name: str

    account_id: UUID
    account_name: str | None = None

    target_amount: Decimal
    saved_amount: Decimal
    monthly_contribution: Decimal
    target_date: date
    status: str

    created_at: datetime
    updated_at: datetime
