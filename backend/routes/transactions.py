from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException

from database.supabase import supabase
from models.transaction import TransactionCreate, TransactionUpdate

router = APIRouter(
    prefix="/api/transactions",
    tags=["Transactions"],
)


TRANSACTION_SELECT = """
    id,
    transaction_date,
    reason,
    category_id,
    account_id,
    amount,
    type,
    transfer_id,
    created_at,
    updated_at
"""


# ============================================================
# HELPERS
# ============================================================


def to_decimal(value) -> Decimal:
    """
    Convert any numeric value to Decimal safely.

    PostgreSQL numeric values are returned as Decimal,
    while Pydantic may give us float values.
    Converting through str avoids floating-point precision
    problems.
    """
    return Decimal(str(value))


def get_account(account_id: UUID):
    response = supabase.table("accounts").select("""
            id,
            name,
            current_balance,
            active
            """).eq("id", str(account_id)).limit(1).execute()

    accounts = response.data or []

    if not accounts:
        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )

    return accounts[0]


def get_transaction(transaction_id: UUID):
    response = (
        supabase.table("transactions")
        .select(TRANSACTION_SELECT)
        .eq("id", str(transaction_id))
        .limit(1)
        .execute()
    )

    transactions = response.data or []

    if not transactions:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    return transactions[0]


def calculate_balance_change(amount, transaction_type):
    """
    Return the signed balance change.

    received -> positive
    sent     -> negative
    """

    amount = to_decimal(amount)

    if transaction_type == "received":
        return amount

    return -amount


# ============================================================
# GET ALL TRANSACTIONS
# ============================================================


@router.get("")
def get_transactions():
    try:
        response = (
            supabase.table("transactions")
            .select(TRANSACTION_SELECT)
            .order("transaction_date", desc=True)
            .execute()
        )

        return {"transactions": response.data or []}

    except Exception as error:
        print(f"Error getting transactions: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# GET ONE TRANSACTION
# ============================================================


@router.get("/{transaction_id}")
def get_transaction_by_id(transaction_id: UUID):
    try:
        transaction = get_transaction(transaction_id)

        return {"transaction": transaction}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error getting transaction: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# CREATE TRANSACTION
# ============================================================


@router.post("")
def create_transaction(transaction: TransactionCreate):
    try:
        # ----------------------------------------------------
        # Get account
        # ----------------------------------------------------

        account = get_account(transaction.account_id)

        if not account["active"]:
            raise HTTPException(
                status_code=400,
                detail="Cannot create a transaction for an inactive account",
            )

        # ----------------------------------------------------
        # Convert money values to Decimal
        # ----------------------------------------------------

        current_balance = to_decimal(account["current_balance"])

        amount = to_decimal(transaction.amount)

        # ----------------------------------------------------
        # Calculate balance change
        # ----------------------------------------------------

        balance_change = calculate_balance_change(
            amount,
            transaction.type.value,
        )

        new_balance = current_balance + balance_change

        # ----------------------------------------------------
        # Create transaction
        # ----------------------------------------------------

        transaction_response = (
            supabase.table("transactions")
            .insert(
                {
                    "transaction_date": (transaction.transaction_date.isoformat()),
                    "reason": transaction.reason,
                    "category_id": (
                        str(transaction.category_id)
                        if transaction.category_id
                        else None
                    ),
                    "account_id": str(transaction.account_id),
                    "amount": str(amount),
                    "type": transaction.type.value,
                }
            )
            .select(TRANSACTION_SELECT)
            .execute()
        )

        if not transaction_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create transaction",
            )

        created_transaction = transaction_response.data[0]

        # ----------------------------------------------------
        # Update account balance
        # ----------------------------------------------------

        try:
            account_response = (
                supabase.table("accounts")
                .update({"current_balance": str(new_balance)})
                .eq("id", str(transaction.account_id))
                .execute()
            )

            if not account_response.data:
                raise Exception("Failed to update account balance")

        except Exception:
            # Roll back transaction if balance update fails.

            supabase.table("transactions").delete().eq(
                "id", created_transaction["id"]
            ).execute()

            raise

        return {"transaction": created_transaction}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error creating transaction: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# UPDATE TRANSACTION
# ============================================================


@router.patch("/{transaction_id}")
def update_transaction(
    transaction_id: UUID,
    transaction: TransactionUpdate,
):
    try:
        existing = get_transaction(transaction_id)

        # ----------------------------------------------------
        # Existing transaction values
        # ----------------------------------------------------

        old_account_id = UUID(existing["account_id"])

        old_amount = to_decimal(existing["amount"])

        old_type = existing["type"]

        old_balance_change = calculate_balance_change(
            old_amount,
            old_type,
        )

        # ----------------------------------------------------
        # New transaction values
        # ----------------------------------------------------

        new_account_id = (
            transaction.account_id
            if transaction.account_id is not None
            else old_account_id
        )

        new_amount = (
            to_decimal(transaction.amount)
            if transaction.amount is not None
            else old_amount
        )

        new_type = transaction.type.value if transaction.type is not None else old_type

        new_balance_change = calculate_balance_change(
            new_amount,
            new_type,
        )

        # ====================================================
        # SAME ACCOUNT
        # ====================================================

        if new_account_id == old_account_id:

            account = get_account(old_account_id)

            current_balance = to_decimal(account["current_balance"])

            # Remove old transaction effect
            # and apply new transaction effect.

            new_balance = current_balance - old_balance_change + new_balance_change

            # ------------------------------------------------
            # Build transaction update
            # ------------------------------------------------

            update_data = {}

            if transaction.transaction_date is not None:
                update_data["transaction_date"] = (
                    transaction.transaction_date.isoformat()
                )

            if transaction.reason is not None:
                update_data["reason"] = transaction.reason

            if transaction.category_id is not None:
                update_data["category_id"] = str(transaction.category_id)

            if transaction.amount is not None:
                update_data["amount"] = str(new_amount)

            if transaction.type is not None:
                update_data["type"] = transaction.type.value

            if transaction.account_id is not None:
                update_data["account_id"] = str(transaction.account_id)

            if not update_data:
                return {"transaction": existing}

            # ------------------------------------------------
            # Update transaction
            # ------------------------------------------------

            updated = (
                supabase.table("transactions")
                .update(update_data)
                .eq("id", str(transaction_id))
                .select(TRANSACTION_SELECT)
                .execute()
            )

            if not updated.data:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to update transaction",
                )

            # ------------------------------------------------
            # Update account balance
            # ------------------------------------------------

            try:
                account_response = (
                    supabase.table("accounts")
                    .update({"current_balance": str(new_balance)})
                    .eq("id", str(old_account_id))
                    .execute()
                )

                if not account_response.data:
                    raise Exception("Failed to update account balance")

            except Exception:

                # Roll back transaction changes.

                supabase.table("transactions").update(
                    {
                        "transaction_date": (existing["transaction_date"]),
                        "reason": existing["reason"],
                        "category_id": existing["category_id"],
                        "account_id": existing["account_id"],
                        "amount": str(existing["amount"]),
                        "type": existing["type"],
                    }
                ).eq("id", str(transaction_id)).execute()

                raise

            return {"transaction": updated.data[0]}

        # ====================================================
        # ACCOUNT CHANGED
        # ====================================================

        old_account = get_account(old_account_id)

        new_account = get_account(new_account_id)

        if not new_account["active"]:
            raise HTTPException(
                status_code=400,
                detail=("Cannot move a transaction " "to an inactive account"),
            )

        old_current_balance = to_decimal(old_account["current_balance"])

        new_current_balance = to_decimal(new_account["current_balance"])

        # Remove old transaction effect
        # from old account.

        old_account_new_balance = old_current_balance - old_balance_change

        # Apply new transaction effect
        # to new account.

        new_account_new_balance = new_current_balance + new_balance_change

        # ----------------------------------------------------
        # Build transaction update
        # ----------------------------------------------------

        update_data = {}

        if transaction.transaction_date is not None:
            update_data["transaction_date"] = transaction.transaction_date.isoformat()

        if transaction.reason is not None:
            update_data["reason"] = transaction.reason

        if transaction.category_id is not None:
            update_data["category_id"] = str(transaction.category_id)

        if transaction.account_id is not None:
            update_data["account_id"] = str(transaction.account_id)

        if transaction.amount is not None:
            update_data["amount"] = str(new_amount)

        if transaction.type is not None:
            update_data["type"] = transaction.type.value

        # ----------------------------------------------------
        # Update transaction
        # ----------------------------------------------------

        updated = (
            supabase.table("transactions")
            .update(update_data)
            .eq("id", str(transaction_id))
            .select(TRANSACTION_SELECT)
            .execute()
        )

        if not updated.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to update transaction",
            )

        # ----------------------------------------------------
        # Update both account balances
        # ----------------------------------------------------

        try:

            old_account_response = (
                supabase.table("accounts")
                .update({"current_balance": str(old_account_new_balance)})
                .eq("id", str(old_account_id))
                .execute()
            )

            if not old_account_response.data:
                raise Exception("Failed to update old account balance")

            new_account_response = (
                supabase.table("accounts")
                .update({"current_balance": str(new_account_new_balance)})
                .eq("id", str(new_account_id))
                .execute()
            )

            if not new_account_response.data:
                raise Exception("Failed to update new account balance")

        except Exception:

            # Roll back transaction.

            supabase.table("transactions").update(
                {
                    "transaction_date": existing["transaction_date"],
                    "reason": existing["reason"],
                    "category_id": existing["category_id"],
                    "account_id": existing["account_id"],
                    "amount": str(existing["amount"]),
                    "type": existing["type"],
                }
            ).eq("id", str(transaction_id)).execute()

            raise

        return {"transaction": updated.data[0]}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error updating transaction: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# DELETE TRANSACTION
# ============================================================


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: UUID):
    try:
        existing = get_transaction(transaction_id)

        # ----------------------------------------------------
        # Transfer transactions must use transfer API.
        # ----------------------------------------------------

        if existing["transfer_id"] is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Transfer transactions must be deleted " "through the transfer API"
                ),
            )

        account_id = UUID(existing["account_id"])

        amount = to_decimal(existing["amount"])

        balance_change = calculate_balance_change(
            amount,
            existing["type"],
        )

        account = get_account(account_id)

        current_balance = to_decimal(account["current_balance"])

        # Reverse the transaction effect.

        new_balance = current_balance - balance_change

        # ----------------------------------------------------
        # Delete transaction
        # ----------------------------------------------------

        delete_response = (
            supabase.table("transactions")
            .delete()
            .eq("id", str(transaction_id))
            .execute()
        )

        if not delete_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete transaction",
            )

        # ----------------------------------------------------
        # Restore account balance
        # ----------------------------------------------------

        try:

            account_response = (
                supabase.table("accounts")
                .update({"current_balance": str(new_balance)})
                .eq("id", str(account_id))
                .execute()
            )

            if not account_response.data:
                raise Exception("Failed to restore account balance")

        except Exception:

            # Re-create transaction if balance update fails.

            supabase.table("transactions").insert(
                {
                    "id": existing["id"],
                    "transaction_date": existing["transaction_date"],
                    "reason": existing["reason"],
                    "category_id": existing["category_id"],
                    "account_id": existing["account_id"],
                    "amount": str(existing["amount"]),
                    "type": existing["type"],
                    "transfer_id": existing["transfer_id"],
                }
            ).execute()

            raise

        return {"message": "Transaction deleted successfully"}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error deleting transaction: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
