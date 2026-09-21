from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ForecastMonth(BaseModel):
    month: str
    label: str

    starting_balance: Decimal
    ending_balance: Decimal

    historical_spending: Decimal
    expected_income: Decimal
    expected_expenses: Decimal
    goal_contributions: Decimal

    net_change: Decimal


class ForecastResponse(BaseModel):
    current_balance: Decimal

    current_month: str
    current_month_income: Decimal
    current_month_expenses: Decimal

    historical_months_used: int
    historical_monthly_income: Decimal
    historical_monthly_spending: Decimal

    monthly_goal_contributions: Decimal

    end_of_month_forecast: Decimal

    forecast_months: list[ForecastMonth]

    methodology: str
