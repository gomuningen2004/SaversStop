from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException

from database.supabase import supabase
from models.debt_interaction import (
    DebtInteractionCreate,
    DebtInteractionUpdate,
)

router = APIRouter(
    prefix="/api/debt-interactions",
    tags=["Debt Interactions"],
)


DEBT_INTERACTION_TYPES = {
    "owed_to_me",
    "payment_received",
    "i_owe",
    "payment_sent",
}


DEBT_INTERACTION_SELECT = """
    id,
    person_id,
    interaction_date,
    amount,
    type,
    reason,
    created_at,
    updated_at
"""


# =========================================================
# HELPERS
# =========================================================


def validate_interaction_type(interaction_type: str):
    if interaction_type not in DEBT_INTERACTION_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid interaction type. "
                "Must be one of: "
                "owed_to_me, payment_received, "
                "i_owe, payment_sent."
            ),
        )


def get_person(person_id: UUID):
    response = supabase.table("people").select("""
            id,
            name,
            active
            """).eq("id", str(person_id)).limit(1).execute()

    people = response.data or []

    if not people:
        raise HTTPException(
            status_code=404,
            detail="Person not found",
        )

    return people[0]


def get_debt_interaction(interaction_id: UUID):
    response = (
        supabase.table("debt_interactions")
        .select(DEBT_INTERACTION_SELECT)
        .eq("id", str(interaction_id))
        .limit(1)
        .execute()
    )

    interactions = response.data or []

    if not interactions:
        raise HTTPException(
            status_code=404,
            detail="Debt interaction not found",
        )

    return interactions[0]


def calculate_balance_effect(
    amount,
    interaction_type: str,
) -> Decimal:
    """
    Positive balance  = person owes me
    Negative balance  = I owe person
    """

    amount = Decimal(str(amount))

    if interaction_type == "owed_to_me":
        return amount

    if interaction_type == "payment_received":
        return -amount

    if interaction_type == "i_owe":
        return -amount

    if interaction_type == "payment_sent":
        return amount

    raise ValueError(f"Invalid interaction type: {interaction_type}")


# =========================================================
# GET ALL DEBT INTERACTIONS
# =========================================================


@router.get("")
def get_debt_interactions():
    try:
        response = (
            supabase.table("debt_interactions")
            .select(DEBT_INTERACTION_SELECT)
            .order("interaction_date", desc=True)
            .execute()
        )

        return {"interactions": response.data or []}

    except Exception as error:
        print(f"Error getting debt interactions: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# GET DEBT INTERACTION BY ID
# =========================================================


@router.get("/{interaction_id}")
def get_debt_interaction_by_id(
    interaction_id: UUID,
):
    try:
        interaction = get_debt_interaction(interaction_id)

        return {"interaction": interaction}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error getting debt interaction: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# GET INTERACTIONS FOR A PERSON
# =========================================================


@router.get("/person/{person_id}")
def get_person_debt_interactions(
    person_id: UUID,
):
    try:
        # ---------------------------------------------
        # Check person exists
        # ---------------------------------------------

        get_person(person_id)

        # ---------------------------------------------
        # Get interactions
        # ---------------------------------------------

        response = (
            supabase.table("debt_interactions")
            .select(DEBT_INTERACTION_SELECT)
            .eq("person_id", str(person_id))
            .order("interaction_date", desc=True)
            .execute()
        )

        return {"interactions": response.data or []}

    except HTTPException:
        raise

    except Exception as error:
        print("Error getting person's debt interactions: " f"{error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# CREATE DEBT INTERACTION
# =========================================================


@router.post("", status_code=201)
def create_debt_interaction(
    interaction: DebtInteractionCreate,
):
    try:
        # ---------------------------------------------
        # Validate type
        # ---------------------------------------------

        validate_interaction_type(interaction.type)

        # ---------------------------------------------
        # Check person
        # ---------------------------------------------

        person = get_person(interaction.person_id)

        if not person["active"]:
            raise HTTPException(
                status_code=400,
                detail=("Cannot create a debt interaction " "for an inactive person."),
            )

        # ---------------------------------------------
        # Create interaction
        # ---------------------------------------------

        response = (
            supabase.table("debt_interactions")
            .insert(
                {
                    "person_id": str(interaction.person_id),
                    "interaction_date": (interaction.interaction_date.isoformat()),
                    "amount": str(interaction.amount),
                    "type": interaction.type,
                    "reason": interaction.reason,
                }
            )
            .select(DEBT_INTERACTION_SELECT)
            .execute()
        )

        created_interactions = response.data or []

        if not created_interactions:
            raise HTTPException(
                status_code=500,
                detail="Debt interaction was not created.",
            )

        return {"interaction": created_interactions[0]}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error creating debt interaction: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# UPDATE DEBT INTERACTION
# =========================================================


@router.patch("/{interaction_id}")
def update_debt_interaction(
    interaction_id: UUID,
    interaction: DebtInteractionUpdate,
):
    try:
        # ---------------------------------------------
        # Get existing interaction
        # ---------------------------------------------

        existing = get_debt_interaction(interaction_id)

        # ---------------------------------------------
        # Validate new type if provided
        # ---------------------------------------------

        if interaction.type is not None:
            validate_interaction_type(interaction.type)

        # ---------------------------------------------
        # Check new person if provided
        # ---------------------------------------------

        if interaction.person_id is not None:
            person = get_person(interaction.person_id)

            if not person["active"]:
                raise HTTPException(
                    status_code=400,
                    detail=("Cannot move a debt interaction " "to an inactive person."),
                )

        # ---------------------------------------------
        # Build update data
        # ---------------------------------------------

        update_data = {}

        if interaction.person_id is not None:
            update_data["person_id"] = str(interaction.person_id)

        if interaction.interaction_date is not None:
            update_data["interaction_date"] = interaction.interaction_date.isoformat()

        if interaction.amount is not None:
            update_data["amount"] = str(interaction.amount)

        if interaction.type is not None:
            update_data["type"] = interaction.type

        if interaction.reason is not None:
            update_data["reason"] = interaction.reason

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields provided for update.",
            )

        # ---------------------------------------------
        # Update interaction
        # ---------------------------------------------

        response = (
            supabase.table("debt_interactions")
            .update(update_data)
            .eq("id", str(interaction_id))
            .select(DEBT_INTERACTION_SELECT)
            .execute()
        )

        updated_interactions = response.data or []

        if not updated_interactions:
            raise HTTPException(
                status_code=500,
                detail="Debt interaction was not updated.",
            )

        return {"interaction": updated_interactions[0]}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error updating debt interaction: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# DELETE DEBT INTERACTION
# =========================================================


@router.delete("/{interaction_id}")
def delete_debt_interaction(
    interaction_id: UUID,
):
    try:
        # ---------------------------------------------
        # Check interaction exists
        # ---------------------------------------------

        get_debt_interaction(interaction_id)

        # ---------------------------------------------
        # Delete
        # ---------------------------------------------

        response = (
            supabase.table("debt_interactions")
            .delete()
            .eq("id", str(interaction_id))
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Debt interaction was not deleted.",
            )

        return {"message": ("Debt interaction deleted successfully.")}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error deleting debt interaction: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
