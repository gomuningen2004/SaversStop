from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException

from database.supabase import supabase
from models.goal import GoalContribution, GoalCreate, GoalUpdate

router = APIRouter(
    prefix="/api/goals",
    tags=["Goals"],
)


GOAL_SELECT = """
    id,
    name,
    account_id,
    target_amount,
    saved_amount,
    monthly_contribution,
    target_date,
    status,
    created_at,
    updated_at,
    accounts (
        id,
        name
    )
"""


def get_goal(goal_id: UUID):
    response = (
        supabase.table("goals")
        .select(GOAL_SELECT)
        .eq("id", str(goal_id))
        .limit(1)
        .execute()
    )

    goals = response.data or []

    if not goals:
        raise HTTPException(
            status_code=404,
            detail="Goal not found.",
        )

    return goals[0]


def verify_account(account_id: UUID):
    response = (
        supabase.table("accounts")
        .select("id, name, active")
        .eq("id", str(account_id))
        .limit(1)
        .execute()
    )

    accounts = response.data or []

    if not accounts:
        raise HTTPException(
            status_code=404,
            detail="Selected account was not found.",
        )

    account = accounts[0]

    if not account.get("active", True):
        raise HTTPException(
            status_code=400,
            detail="Selected account is inactive.",
        )

    return account


def format_goal(goal):
    """
    Convert Supabase's nested account object into the
    response shape expected by the frontend.
    """

    account = goal.get("accounts")

    return {
        "id": goal["id"],
        "name": goal["name"],
        "account_id": goal["account_id"],
        "account_name": account["name"] if account else None,
        "target_amount": goal["target_amount"],
        "saved_amount": goal["saved_amount"],
        "monthly_contribution": goal["monthly_contribution"],
        "target_date": goal["target_date"],
        "status": goal["status"],
        "created_at": goal["created_at"],
        "updated_at": goal["updated_at"],
    }


@router.get("")
def get_goals():
    try:
        response = (
            supabase.table("goals")
            .select(GOAL_SELECT)
            .order("status")
            .order("target_date")
            .execute()
        )

        goals = response.data or []

        return {
            "goals": [format_goal(goal) for goal in goals],
        }

    except Exception as error:
        print(f"Error getting goals: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.get("/{goal_id}")
def get_goal_by_id(goal_id: UUID):
    try:
        goal = get_goal(goal_id)

        return format_goal(goal)

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error getting goal: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.post("", status_code=201)
def create_goal(goal: GoalCreate):
    try:
        # Verify the selected account.
        verify_account(goal.account_id)

        target_amount = goal.target_amount
        saved_amount = goal.saved_amount

        if saved_amount > target_amount:
            raise HTTPException(
                status_code=400,
                detail="Saved amount cannot be greater than target amount.",
            )

        status = "completed" if saved_amount >= target_amount else goal.status

        response = (
            supabase.table("goals")
            .insert(
                {
                    "name": goal.name.strip(),
                    "account_id": str(goal.account_id),
                    "target_amount": str(target_amount),
                    "saved_amount": str(saved_amount),
                    "monthly_contribution": str(goal.monthly_contribution),
                    "target_date": goal.target_date.isoformat(),
                    "status": status,
                }
            )
            .select(GOAL_SELECT)
            .execute()
        )

        created_goals = response.data or []

        if not created_goals:
            raise HTTPException(
                status_code=500,
                detail="Goal was not created.",
            )

        return format_goal(created_goals[0])

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error creating goal: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.patch("/{goal_id}")
def update_goal(
    goal_id: UUID,
    goal: GoalUpdate,
):
    try:
        existing_goal = get_goal(goal_id)

        update_data = {}

        if goal.name is not None:
            update_data["name"] = goal.name.strip()

        if goal.account_id is not None:
            verify_account(goal.account_id)

            update_data["account_id"] = str(goal.account_id)

        if goal.target_amount is not None:
            update_data["target_amount"] = str(goal.target_amount)

        if goal.saved_amount is not None:
            update_data["saved_amount"] = str(goal.saved_amount)

        if goal.monthly_contribution is not None:
            update_data["monthly_contribution"] = str(goal.monthly_contribution)

        if goal.target_date is not None:
            update_data["target_date"] = goal.target_date.isoformat()

        if goal.status is not None:
            update_data["status"] = goal.status

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields provided for update.",
            )

        target_amount = Decimal(
            str(
                update_data.get(
                    "target_amount",
                    existing_goal["target_amount"],
                )
            )
        )

        saved_amount = Decimal(
            str(
                update_data.get(
                    "saved_amount",
                    existing_goal["saved_amount"],
                )
            )
        )

        if saved_amount > target_amount:
            raise HTTPException(
                status_code=400,
                detail="Saved amount cannot be greater than target amount.",
            )

        if saved_amount >= target_amount:
            update_data["status"] = "completed"

        response = (
            supabase.table("goals")
            .update(update_data)
            .eq("id", str(goal_id))
            .select(GOAL_SELECT)
            .execute()
        )

        updated_goals = response.data or []

        if not updated_goals:
            raise HTTPException(
                status_code=500,
                detail="Goal was not updated.",
            )

        return format_goal(updated_goals[0])

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error updating goal: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.post("/{goal_id}/contribute")
def add_goal_contribution(
    goal_id: UUID,
    contribution: GoalContribution,
):
    try:
        existing_goal = get_goal(goal_id)

        if existing_goal["status"] == "completed":
            raise HTTPException(
                status_code=400,
                detail="Cannot add a contribution to a completed goal.",
            )

        current_saved = Decimal(str(existing_goal["saved_amount"]))

        target_amount = Decimal(str(existing_goal["target_amount"]))

        contribution_amount = contribution.amount

        remaining_amount = max(
            target_amount - current_saved,
            Decimal("0"),
        )

        actual_contribution = min(
            contribution_amount,
            remaining_amount,
        )

        new_saved_amount = current_saved + actual_contribution

        new_status = "completed" if new_saved_amount >= target_amount else "active"

        response = (
            supabase.table("goals")
            .update(
                {
                    "saved_amount": str(new_saved_amount),
                    "status": new_status,
                }
            )
            .eq("id", str(goal_id))
            .select(GOAL_SELECT)
            .execute()
        )

        updated_goals = response.data or []

        if not updated_goals:
            raise HTTPException(
                status_code=500,
                detail="Contribution was not saved.",
            )

        return format_goal(updated_goals[0])

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error adding goal contribution: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.delete("/{goal_id}")
def delete_goal(goal_id: UUID):
    try:
        get_goal(goal_id)

        supabase.table("goals").delete().eq("id", str(goal_id)).execute()

        return {
            "message": "Goal deleted successfully.",
        }

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error deleting goal: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
