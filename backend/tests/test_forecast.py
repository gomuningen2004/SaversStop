import importlib
import sys
import unittest
from datetime import date as RealDate
from decimal import Decimal
from pathlib import Path
from types import ModuleType
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

supabase_stub = ModuleType("database.supabase")
supabase_stub.supabase = None
with patch.dict(sys.modules, {"database.supabase": supabase_stub}):
    forecast = importlib.import_module("services.forecast")


class FixedDate(RealDate):
    @classmethod
    def today(cls):
        return cls(2026, 10, 31)


class ForecastTests(unittest.TestCase):
    def test_current_balance_only_includes_asset_accounts(self):
        balance = forecast.calculate_asset_balance(
            [
                {
                    "current_balance": "1200.25",
                    "account_types": {"classification": "asset"},
                },
                {
                    "current_balance": "-30.00",
                    "account_types": {"classification": "asset"},
                },
                {
                    "current_balance": "5000.00",
                    "account_types": {"classification": "liability"},
                },
            ]
        )

        self.assertEqual(balance, Decimal("1170.25"))

    def test_monthly_history_classifies_income_and_excludes_transfers(self):
        transactions = [
            {
                "transaction_date": "2026-07-05T12:00:00",
                "amount": "1000",
                "type": "received",
                "category_id": "salary",
                "transfer_id": None,
            },
            {
                "transaction_date": "2026-07-06T12:00:00",
                "amount": "250",
                "type": "received",
                "category_id": "extra",
                "transfer_id": None,
            },
            {
                "transaction_date": "2026-07-07T12:00:00",
                "amount": "40",
                "type": "received",
                "category_id": "gift",
                "transfer_id": None,
            },
            {
                "transaction_date": "2026-07-08T12:00:00",
                "amount": "300",
                "type": "sent",
                "category_id": "food",
                "transfer_id": None,
            },
            {
                "transaction_date": "2026-07-09T12:00:00",
                "amount": "900",
                "type": "sent",
                "category_id": "transfer",
                "transfer_id": "pair-1",
            },
        ]

        monthly = forecast.calculate_monthly_history(
            transactions,
            {"salary"},
        )

        self.assertEqual(
            monthly["2026-07"],
            {"income": Decimal("1000.00"), "expenses": Decimal("300.00")},
        )

    def test_salary_run_rate_uses_latest_completed_salary_month(self):
        monthly_salary = {
            "2026-06": Decimal("32798.00"),
            "2026-07": Decimal("32798.00"),
            "2026-08": Decimal("32798.00"),
            "2026-09": Decimal("32798.00"),
        }

        run_rate = forecast.calculate_salary_run_rate(
            monthly_salary,
            ["2026-09", "2026-08", "2026-07", "2026-06"],
        )

        self.assertEqual(forecast.INCOME_CATEGORY_NAMES, {"salary"})
        self.assertEqual(run_rate, Decimal("32798.00"))

    def test_current_month_actuals_are_not_added_to_live_balance_twice(self):
        transactions = []
        for month in ("2026-07", "2026-08", "2026-09"):
            transactions.extend(
                [
                    {
                        "transaction_date": f"{month}-05T12:00:00",
                        "amount": "32798",
                        "type": "received",
                        "category_id": "salary",
                        "transfer_id": None,
                    },
                    {
                        "transaction_date": f"{month}-08T12:00:00",
                        "amount": "500",
                        "type": "sent",
                        "category_id": "expense",
                        "transfer_id": None,
                    },
                ]
            )

        transactions.extend(
            [
                {
                    "transaction_date": "2026-10-10T12:00:00",
                    "amount": "12000",
                    "type": "received",
                    "category_id": "salary",
                    "transfer_id": None,
                },
                {
                    "transaction_date": "2026-10-12T12:00:00",
                    "amount": "50",
                    "type": "sent",
                    "category_id": "expense",
                    "transfer_id": None,
                },
            ]
        )
        goals = [
            {
                "id": "goal-1",
                "status": "active",
                "target_date": "2026-12-15",
                "target_amount": "1000",
                "saved_amount": "900",
                "monthly_contribution": "300",
            }
        ]

        with (
            patch.object(forecast, "date", FixedDate),
            patch.object(
                forecast, "get_current_balance", return_value=Decimal("5000.00")
            ),
            patch.object(forecast, "get_income_category_ids", return_value={"salary"}),
            patch.object(forecast, "get_transactions", return_value=transactions),
            patch.object(forecast, "get_goals", return_value=goals),
        ):
            result = forecast.build_forecast(months=3, history_months=3)

        current_month = result["forecast_months"][0]
        self.assertEqual(current_month["starting_balance"], Decimal("5000.00"))
        self.assertEqual(current_month["expected_income"], Decimal("32798.00"))
        self.assertEqual(current_month["expected_expenses"], Decimal("50.00"))
        self.assertEqual(current_month["goal_contributions"], Decimal("100.00"))
        self.assertEqual(current_month["net_change"], Decimal("20698.00"))
        self.assertEqual(current_month["ending_balance"], Decimal("25698.00"))
        self.assertEqual(result["current_month_income"], Decimal("12000.00"))

    def test_goal_contributions_are_capped_at_remaining_amount(self):
        goals = [
            {
                "id": "goal-1",
                "status": "active",
                "target_date": "2026-12-15",
                "target_amount": "1000",
                "saved_amount": "900",
                "monthly_contribution": "300",
            }
        ]
        remaining = forecast.initialize_goal_remaining(goals)

        october_contribution = forecast.calculate_goal_contributions(
            goals,
            "2026-10",
            remaining,
        )
        november_contribution = forecast.calculate_goal_contributions(
            goals,
            "2026-11",
            remaining,
        )

        self.assertEqual(october_contribution, Decimal("100.00"))
        self.assertEqual(november_contribution, Decimal("0.00"))

    def test_goal_contributions_stop_after_target_date(self):
        goal = {
            "id": "past-goal",
            "status": "active",
            "target_date": "2026-10-15",
            "target_amount": "1000",
            "saved_amount": "500",
            "monthly_contribution": "100",
        }

        with patch.object(forecast, "date", FixedDate):
            contribution = forecast.calculate_goal_contributions(
                [goal],
                "2026-10",
                forecast.initialize_goal_remaining([goal]),
            )

        self.assertEqual(contribution, Decimal("0.00"))


if __name__ == "__main__":
    unittest.main()
