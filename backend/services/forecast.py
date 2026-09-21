from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from database.supabase import supabase

MONEY_QUANT = Decimal("0.01")

# ============================================================
# INCOME CATEGORIES
# ============================================================
#
# Only transactions assigned to these categories are treated
# as income by the forecast.
#
# IMPORTANT:
# These names must match the names stored in your categories
# table.
#
INCOME_CATEGORY_NAMES = {
    "salary",
    "extra income",
}


# ============================================================
# MONEY HELPERS
# ============================================================


def money(value) -> Decimal:
    """
    Convert a database/Python numeric value into Decimal
    with two decimal places.
    """

    return Decimal(str(value or 0)).quantize(
        MONEY_QUANT,
        rounding=ROUND_HALF_UP,
    )


# ============================================================
# DATE HELPERS
# ============================================================


def month_key(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}"


def add_months(year: int, month: int, amount: int):
    """
    Add/subtract months without relying on external libraries.
    """

    month_index = year * 12 + (month - 1)
    month_index += amount

    new_year = month_index // 12
    new_month = month_index % 12 + 1

    return new_year, new_month


def month_label(month: str) -> str:
    year, month_number = month.split("-")

    month_names = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ]

    return f"{month_names[int(month_number) - 1]} {year}"


def get_current_month():
    today = date.today()

    return today.year, today.month


def get_previous_months(count: int):
    """
    Return the last `count` completed calendar months.

    Example:

    Current month = September 2026
    count = 6

    Returns:

    2026-08
    2026-07
    2026-06
    2026-05
    2026-04
    2026-03
    """

    current_year, current_month = get_current_month()

    months = []

    for index in range(1, count + 1):
        year, month = add_months(
            current_year,
            current_month,
            -index,
        )

        months.append(month_key(year, month))

    return months


def get_future_months(count: int):
    """
    Return current month + future months.
    """

    current_year, current_month = get_current_month()

    months = []

    for index in range(count):
        year, month = add_months(
            current_year,
            current_month,
            index,
        )

        months.append(month_key(year, month))

    return months


# ============================================================
# HISTORICAL AVERAGE
# ============================================================


def calculate_weighted_average(
    monthly_values: dict[str, Decimal],
    months: list[str],
) -> Decimal:
    """
    Calculate a weighted historical average.

    The newest completed month receives the highest weight.

    Example for six months:

    oldest -> weight 1
    newest -> weight 6
    """

    if not months:
        return Decimal("0.00")

    total_weight = Decimal("0")
    weighted_total = Decimal("0")

    for index, month in enumerate(reversed(months), start=1):
        value = monthly_values.get(
            month,
            Decimal("0"),
        )

        weight = Decimal(index)

        weighted_total += value * weight
        total_weight += weight

    if total_weight == 0:
        return Decimal("0.00")

    return money(weighted_total / total_weight)


# ============================================================
# CURRENT BALANCE
# ============================================================


def get_current_balance():
    """
    Calculate the current balance from active accounts.

    For the current implementation, active account balances are
    summed exactly as the existing frontend did.
    """

    response = supabase.table("accounts").select("""
            id,
            current_balance,
            active,
            account_type_id
        """).eq("active", True).execute()

    accounts = response.data or []

    return money(
        sum(
            (money(account["current_balance"]) for account in accounts),
            Decimal("0"),
        )
    )


# ============================================================
# CATEGORIES
# ============================================================


def get_income_category_ids():
    """
    Retrieve the category IDs that should be treated as income.

    Only these category names are considered income:

        Salary
        Extra Income

    Category names are compared case-insensitively.
    """

    response = supabase.table("categories").select("""
            id,
            name
        """).execute()

    categories = response.data or []

    income_category_ids = set()

    for category in categories:
        name = str(category.get("name") or "").strip().lower()

        if name in INCOME_CATEGORY_NAMES:
            income_category_ids.add(str(category["id"]))

    return income_category_ids


# ============================================================
# TRANSACTIONS
# ============================================================


def get_transactions():
    """
    Retrieve transactions required for forecasting.

    Transfer transactions are excluded because they do not
    change overall available money.

    category_id is included because income is determined by
    category rather than simply by transaction type.
    """

    response = supabase.table("transactions").select("""
            id,
            transaction_date,
            amount,
            type,
            transfer_id,
            account_id,
            category_id
        """).is_("transfer_id", "null").order("transaction_date", desc=False).execute()

    return response.data or []


# ============================================================
# MONTHLY HISTORY
# ============================================================


def calculate_monthly_history(
    transactions,
    income_category_ids,
):
    """
    Convert transaction history into:

    {
        "2026-01": {
            "income": Decimal(...),
            "expenses": Decimal(...)
        }
    }

    Income rules:

        received + Salary       -> income
        received + Extra Income -> income

    All other received transactions are ignored for income.

    Expenses:

        sent transactions are treated as expenses.

    Transfers have already been excluded by get_transactions().
    """

    monthly = {}

    for transaction in transactions:

        transaction_date = transaction.get("transaction_date")

        if not transaction_date:
            continue

        month = transaction_date[:7]

        if month not in monthly:
            monthly[month] = {
                "income": Decimal("0.00"),
                "expenses": Decimal("0.00"),
            }

        amount = money(transaction["amount"])

        transaction_type = transaction.get("type")

        category_id = transaction.get("category_id")

        category_id = str(category_id) if category_id is not None else None

        # ----------------------------------------------------
        # INCOME
        # ----------------------------------------------------

        if transaction_type == "received" and category_id in income_category_ids:
            monthly[month]["income"] += amount

        # ----------------------------------------------------
        # EXPENSE
        # ----------------------------------------------------

        elif transaction_type == "sent":
            monthly[month]["expenses"] += amount

    return monthly


# ============================================================
# GOALS
# ============================================================


def get_goals():
    """
    Retrieve active goals.

    The forecast only needs the monthly contribution.
    """

    response = supabase.table("goals").select("""
            id,
            name,
            target_amount,
            saved_amount,
            monthly_contribution,
            target_date,
            status
        """).eq("status", "active").execute()

    return response.data or []


def calculate_goal_contributions(goals):
    """
    Sum active goal monthly contributions.

    Contributions <= 0 are ignored.
    """

    total = Decimal("0.00")

    for goal in goals:

        contribution = money(goal.get("monthly_contribution"))

        if contribution > 0:
            total += contribution

    return money(total)


# ============================================================
# CURRENT MONTH ACTUALS
# ============================================================


def calculate_current_month_actuals(
    monthly_history,
):
    """
    Return actual income and expenses for the current month.

    Income already follows the Salary + Extra Income rule
    because monthly_history was built using category filtering.
    """

    current_year, current_month = get_current_month()

    current_month_key = month_key(
        current_year,
        current_month,
    )

    current = monthly_history.get(
        current_month_key,
        {
            "income": Decimal("0.00"),
            "expenses": Decimal("0.00"),
        },
    )

    return (
        current_month_key,
        money(current["income"]),
        money(current["expenses"]),
    )


# ============================================================
# FORECAST ENGINE
# ============================================================


def build_forecast(
    months: int = 3,
    history_months: int = 6,
):
    """
    Main forecast engine.

    Income is calculated only from transactions whose category
    is Salary or Extra Income.

    Expenses are calculated from sent transactions.

    Transfer transactions are excluded.
    """

    # ========================================================
    # CURRENT BALANCE
    # ========================================================

    current_balance = get_current_balance()

    # ========================================================
    # INCOME CATEGORIES
    # ========================================================

    income_category_ids = get_income_category_ids()

    # ========================================================
    # TRANSACTIONS
    # ========================================================

    transactions = get_transactions()

    monthly_history = calculate_monthly_history(
        transactions,
        income_category_ids,
    )

    # ========================================================
    # HISTORICAL MONTHS
    # ========================================================

    historical_months = get_previous_months(history_months)

    monthly_income = {
        month: monthly_history.get(
            month,
            {
                "income": Decimal("0.00"),
                "expenses": Decimal("0.00"),
            },
        )["income"]
        for month in historical_months
    }

    monthly_expenses = {
        month: monthly_history.get(
            month,
            {
                "income": Decimal("0.00"),
                "expenses": Decimal("0.00"),
            },
        )["expenses"]
        for month in historical_months
    }

    # ========================================================
    # HISTORICAL AVERAGES
    # ========================================================

    historical_monthly_income = calculate_weighted_average(
        monthly_income,
        historical_months,
    )

    historical_monthly_spending = calculate_weighted_average(
        monthly_expenses,
        historical_months,
    )

    # ========================================================
    # CURRENT MONTH ACTUALS
    # ========================================================

    (
        current_month_key,
        current_month_income,
        current_month_expenses,
    ) = calculate_current_month_actuals(monthly_history)

    # ========================================================
    # GOALS
    # ========================================================

    goals = get_goals()

    monthly_goal_contributions = calculate_goal_contributions(goals)

    # ========================================================
    # FUTURE FORECAST
    # ========================================================

    forecast_month_keys = get_future_months(months)

    forecast_months = []

    balance = current_balance

    for index, month in enumerate(forecast_month_keys):

        # ====================================================
        # CURRENT MONTH
        # ====================================================

        if index == 0:

            today = date.today()

            days_elapsed = today.day

            # ------------------------------------------------
            # Number of days in current month
            # ------------------------------------------------

            next_month_year, next_month = add_months(
                today.year,
                today.month,
                1,
            )

            first_next_month = date(
                next_month_year,
                next_month,
                1,
            )

            current_month_start = date(
                today.year,
                today.month,
                1,
            )

            days_in_month = (first_next_month - current_month_start).days

            remaining_days = max(
                days_in_month - days_elapsed,
                0,
            )

            # ------------------------------------------------
            # Expected income
            # ------------------------------------------------

            if days_elapsed > 0:

                expected_total_income = money(
                    current_month_income
                    + (
                        historical_monthly_income
                        * Decimal(remaining_days)
                        / Decimal(days_in_month)
                    )
                )

                # ------------------------------------------------
                # Expected expenses
                # ------------------------------------------------

                expected_total_expenses = money(
                    current_month_expenses
                    + (
                        historical_monthly_spending
                        * Decimal(remaining_days)
                        / Decimal(days_in_month)
                    )
                )

            else:

                expected_total_income = historical_monthly_income

                expected_total_expenses = historical_monthly_spending

        # ====================================================
        # FUTURE MONTHS
        # ====================================================

        else:

            expected_total_income = historical_monthly_income

            expected_total_expenses = historical_monthly_spending

        # ====================================================
        # GOALS
        # ====================================================

        goal_contributions = monthly_goal_contributions

        # ====================================================
        # NET CHANGE
        # ====================================================

        net_change = money(
            expected_total_income - expected_total_expenses - goal_contributions
        )

        starting_balance = balance

        ending_balance = money(starting_balance + net_change)

        forecast_months.append(
            {
                "month": month,
                "label": month_label(month),
                "starting_balance": starting_balance,
                "ending_balance": ending_balance,
                "historical_spending": (historical_monthly_spending),
                "expected_income": (expected_total_income),
                "expected_expenses": (expected_total_expenses),
                "goal_contributions": (goal_contributions),
                "net_change": net_change,
            }
        )

        balance = ending_balance

    # ========================================================
    # END OF MONTH FORECAST
    # ========================================================

    end_of_month_forecast = (
        forecast_months[0]["ending_balance"] if forecast_months else current_balance
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "current_balance": current_balance,
        "current_month": current_month_key,
        "current_month_income": (current_month_income),
        "current_month_expenses": (current_month_expenses),
        "historical_months_used": (len(historical_months)),
        "historical_monthly_income": (historical_monthly_income),
        "historical_monthly_spending": (historical_monthly_spending),
        "monthly_goal_contributions": (monthly_goal_contributions),
        "end_of_month_forecast": (end_of_month_forecast),
        "forecast_months": forecast_months,
        "methodology": (
            "Forecast income is calculated only from "
            "received transactions categorized as "
            "Salary or Extra Income. Other received "
            "transactions are not treated as income. "
            "Expenses are calculated from sent "
            "transactions. Self-transfers are excluded "
            "because they do not change overall "
            "available money. Historical income and "
            "spending use a weighted average of the "
            f"previous {history_months} completed "
            "months, giving greater weight to recent "
            "activity. Current-month actual income "
            "and spending are combined with expected "
            "remaining activity. Active goal "
            "contributions are deducted from projected "
            "monthly cash flow."
        ),
    }
