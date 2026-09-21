from fastapi import APIRouter, HTTPException
from uuid import UUID

from database.supabase import supabase
from models.account import AccountCreate, AccountUpdate

router = APIRouter(
    prefix="/api/accounts",
    tags=["Accounts"],
)


@router.get("")
def get_accounts():
    try:
        response = supabase.table("accounts").select("""
                id,
                name,
                account_type_id,
                current_balance,
                active,
                account_types (
                    id,
                    name,
                    classification,
                    active
                )
                """).execute()

        return {"accounts": response.data}

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.post("")
def create_account(account: AccountCreate):
    try:
        response = (
            supabase.table("accounts")
            .insert(
                {
                    "name": account.name,
                    "account_type_id": str(account.account_type_id),
                    "current_balance": str(account.current_balance),
                    "active": account.active,
                }
            )
            .select("""
                id,
                name,
                account_type_id,
                current_balance,
                active,
                account_types (
                    id,
                    name,
                    classification,
                    active
                )
                """)
            .execute()
        )

        return {"account": response.data[0]}

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.patch("/{account_id}")
def update_account(account_id: UUID, account: AccountUpdate):
    try:
        update_data = account.model_dump(exclude_unset=True)

        if "account_type_id" in update_data:
            update_data["account_type_id"] = str(update_data["account_type_id"])

        if "current_balance" in update_data:
            update_data["current_balance"] = str(update_data["current_balance"])

        response = (
            supabase.table("accounts")
            .update(update_data)
            .eq("id", str(account_id))
            .select("""
                id,
                name,
                account_type_id,
                current_balance,
                active,
                account_types (
                    id,
                    name,
                    classification,
                    active
                )
                """)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Account not found",
            )

        return {"account": response.data[0]}

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
