from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException

from database.supabase import supabase
from models.transfer import TransferCreate, TransferUpdate

router = APIRouter(
    prefix="/api/transfers",
    tags=["Transfers"],
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


TRANSFER_SELECT = """
    id,
    transfer_date,
    created_at,
    updated_at
"""


# ============================================================
# HELPERS
# ============================================================


def get_account(account_id: UUID):
    response = supabase.table("accounts").select("""
            id,
            name,
            current_balance,
            active
            """).eq("id", str(account_id)).maybe_single().execute()

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )

    account = response.data

    account["current_balance"] = Decimal(str(account["current_balance"]))

    return account


def get_transfer(transfer_id: UUID):
    response = (
        supabase.table("transfers")
        .select(TRANSFER_SELECT)
        .eq("id", str(transfer_id))
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Transfer not found",
        )

    return response.data


def get_transfer_transactions(transfer_id: UUID):
    response = (
        supabase.table("transactions")
        .select(TRANSACTION_SELECT)
        .eq("transfer_id", str(transfer_id))
        .execute()
    )

    transactions = response.data

    for transaction in transactions:
        transaction["amount"] = Decimal(str(transaction["amount"]))

    return transactions


# ============================================================
# GET ALL TRANSFERS
# ============================================================


@router.get("")
def get_transfers():
    try:
        response = (
            supabase.table("transfers")
            .select(TRANSFER_SELECT)
            .order("transfer_date", desc=True)
            .execute()
        )

        return {"transfers": response.data}

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# GET ONE TRANSFER
# ============================================================


@router.get("/{transfer_id}")
def get_transfer_by_id(transfer_id: UUID):
    try:
        transfer = get_transfer(transfer_id)
        transactions = get_transfer_transactions(transfer_id)

        return {
            "transfer": transfer,
            "transactions": transactions,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# CREATE TRANSFER
# ============================================================


@router.post("")
def create_transfer(transfer: TransferCreate):
    try:
        # ----------------------------------------------------
        # Validate source and destination
        # ----------------------------------------------------

        if transfer.source_account_id == transfer.destination_account_id:
            raise HTTPException(
                status_code=400,
                detail=("Source and destination accounts " "must be different"),
            )

        source_account = get_account(transfer.source_account_id)

        destination_account = get_account(transfer.destination_account_id)

        if not source_account["active"]:
            raise HTTPException(
                status_code=400,
                detail="Source account is inactive",
            )

        if not destination_account["active"]:
            raise HTTPException(
                status_code=400,
                detail="Destination account is inactive",
            )

        # ----------------------------------------------------
        # Check source balance
        # ----------------------------------------------------

        if source_account["current_balance"] < transfer.amount:
            raise HTTPException(
                status_code=400,
                detail="Insufficient balance in source account",
            )

        # ----------------------------------------------------
        # Create transfer record
        # ----------------------------------------------------

        transfer_response = (
            supabase.table("transfers")
            .insert({"transfer_date": (transfer.transfer_date.isoformat())})
            .select(TRANSFER_SELECT)
            .execute()
        )

        if not transfer_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create transfer",
            )

        created_transfer = transfer_response.data[0]
        transfer_id = created_transfer["id"]

        source_transaction = None
        destination_transaction = None

        try:
            # ------------------------------------------------
            # Create source transaction
            # ------------------------------------------------

            source_transaction_response = (
                supabase.table("transactions")
                .insert(
                    {
                        "transaction_date": (transfer.transfer_date.isoformat()),
                        "reason": transfer.reason,
                        "category_id": None,
                        "account_id": str(transfer.source_account_id),
                        "amount": str(transfer.amount),
                        "type": "sent",
                        "transfer_id": transfer_id,
                    }
                )
                .select(TRANSACTION_SELECT)
                .execute()
            )

            if not source_transaction_response.data:
                raise Exception("Failed to create source transaction")

            source_transaction = source_transaction_response.data[0]

            # ------------------------------------------------
            # Create destination transaction
            # ------------------------------------------------

            destination_transaction_response = (
                supabase.table("transactions")
                .insert(
                    {
                        "transaction_date": (transfer.transfer_date.isoformat()),
                        "reason": transfer.reason,
                        "category_id": None,
                        "account_id": str(transfer.destination_account_id),
                        "amount": str(transfer.amount),
                        "type": "received",
                        "transfer_id": transfer_id,
                    }
                )
                .select(TRANSACTION_SELECT)
                .execute()
            )

            if not destination_transaction_response.data:
                raise Exception("Failed to create destination transaction")

            destination_transaction = destination_transaction_response.data[0]

            # ------------------------------------------------
            # Update source account
            # ------------------------------------------------

            source_new_balance = source_account["current_balance"] - transfer.amount

            source_balance_response = (
                supabase.table("accounts")
                .update({"current_balance": str(source_new_balance)})
                .eq(
                    "id",
                    str(transfer.source_account_id),
                )
                .execute()
            )

            if not source_balance_response.data:
                raise Exception("Failed to update source account balance")

            # ------------------------------------------------
            # Update destination account
            # ------------------------------------------------

            destination_new_balance = (
                destination_account["current_balance"] + transfer.amount
            )

            destination_balance_response = (
                supabase.table("accounts")
                .update({"current_balance": str(destination_new_balance)})
                .eq(
                    "id",
                    str(transfer.destination_account_id),
                )
                .execute()
            )

            if not destination_balance_response.data:
                raise Exception("Failed to update destination account balance")

        except Exception:
            # -----------------------------------------------
            # Best-effort rollback
            # -----------------------------------------------

            supabase.table("transactions").delete().eq(
                "transfer_id", transfer_id
            ).execute()

            supabase.table("transfers").delete().eq("id", transfer_id).execute()

            raise

        return {
            "transfer": created_transfer,
            "transactions": [
                source_transaction,
                destination_transaction,
            ],
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# UPDATE TRANSFER
# ============================================================


@router.patch("/{transfer_id}")
def update_transfer(
    transfer_id: UUID,
    transfer: TransferUpdate,
):
    try:
        # ----------------------------------------------------
        # Get existing transfer
        # ----------------------------------------------------

        existing_transfer = get_transfer(transfer_id)

        existing_transactions = get_transfer_transactions(transfer_id)

        if len(existing_transactions) != 2:
            raise HTTPException(
                status_code=500,
                detail="Transfer data is incomplete",
            )

        old_sent = next(
            (
                transaction
                for transaction in existing_transactions
                if transaction["type"] == "sent"
            ),
            None,
        )

        old_received = next(
            (
                transaction
                for transaction in existing_transactions
                if transaction["type"] == "received"
            ),
            None,
        )

        if not old_sent or not old_received:
            raise HTTPException(
                status_code=500,
                detail="Transfer transactions are invalid",
            )

        # ----------------------------------------------------
        # Existing values
        # ----------------------------------------------------

        old_source_account_id = UUID(old_sent["account_id"])

        old_destination_account_id = UUID(old_received["account_id"])

        old_amount = Decimal(str(old_sent["amount"]))

        # ----------------------------------------------------
        # Determine new values
        # ----------------------------------------------------

        new_source_account_id = (
            transfer.source_account_id
            if transfer.source_account_id is not None
            else old_source_account_id
        )

        new_destination_account_id = (
            transfer.destination_account_id
            if transfer.destination_account_id is not None
            else old_destination_account_id
        )

        new_amount = transfer.amount if transfer.amount is not None else old_amount

        new_date = (
            transfer.transfer_date
            if transfer.transfer_date is not None
            else existing_transfer["transfer_date"]
        )

        new_reason = (
            transfer.reason if transfer.reason is not None else old_sent["reason"]
        )

        # ----------------------------------------------------
        # Validate accounts
        # ----------------------------------------------------

        if new_source_account_id == new_destination_account_id:
            raise HTTPException(
                status_code=400,
                detail=("Source and destination accounts " "must be different"),
            )

        old_source_account = get_account(old_source_account_id)

        old_destination_account = get_account(old_destination_account_id)

        new_source_account = get_account(new_source_account_id)

        new_destination_account = get_account(new_destination_account_id)

        if not new_source_account["active"]:
            raise HTTPException(
                status_code=400,
                detail="Source account is inactive",
            )

        if not new_destination_account["active"]:
            raise HTTPException(
                status_code=400,
                detail="Destination account is inactive",
            )

        # ----------------------------------------------------
        # Calculate balances
        #
        # First remove the old transfer effect from the
        # current account balances.
        # Then apply the new transfer effect.
        # ----------------------------------------------------

        balances = {
            str(old_source_account_id): (old_source_account["current_balance"]),
            str(old_destination_account_id): (
                old_destination_account["current_balance"]
            ),
            str(new_source_account_id): (new_source_account["current_balance"]),
            str(new_destination_account_id): (
                new_destination_account["current_balance"]
            ),
        }

        # Remove old transfer effect
        balances[str(old_source_account_id)] += old_amount

        balances[str(old_destination_account_id)] -= old_amount

        # Check the source balance after removing the old
        # transfer effect.
        new_source_base = balances[str(new_source_account_id)]

        if new_source_base < new_amount:
            raise HTTPException(
                status_code=400,
                detail="Insufficient balance in source account",
            )

        # Apply new transfer effect
        balances[str(new_source_account_id)] -= new_amount

        balances[str(new_destination_account_id)] += new_amount

        # ----------------------------------------------------
        # Save original values for rollback
        # ----------------------------------------------------

        original_balances = {
            str(old_source_account_id): (old_source_account["current_balance"]),
            str(old_destination_account_id): (
                old_destination_account["current_balance"]
            ),
            str(new_source_account_id): (new_source_account["current_balance"]),
            str(new_destination_account_id): (
                new_destination_account["current_balance"]
            ),
        }

        # ----------------------------------------------------
        # Update transfer record
        # ----------------------------------------------------

        transfer_update_data = {}

        if transfer.transfer_date is not None:
            transfer_update_data["transfer_date"] = transfer.transfer_date.isoformat()

        try:
            if transfer_update_data:
                transfer_update_response = (
                    supabase.table("transfers")
                    .update(transfer_update_data)
                    .eq("id", str(transfer_id))
                    .execute()
                )

                if not transfer_update_response.data:
                    raise Exception("Failed to update transfer")

            # ------------------------------------------------
            # Update source transaction
            # ------------------------------------------------

            source_transaction_response = (
                supabase.table("transactions")
                .update(
                    {
                        "transaction_date": (
                            new_date.isoformat()
                            if hasattr(
                                new_date,
                                "isoformat",
                            )
                            else new_date
                        ),
                        "reason": new_reason,
                        "account_id": str(new_source_account_id),
                        "amount": str(new_amount),
                        "type": "sent",
                    }
                )
                .eq("id", old_sent["id"])
                .execute()
            )

            if not source_transaction_response.data:
                raise Exception("Failed to update source transaction")

            # ------------------------------------------------
            # Update destination transaction
            # ------------------------------------------------

            destination_transaction_response = (
                supabase.table("transactions")
                .update(
                    {
                        "transaction_date": (
                            new_date.isoformat()
                            if hasattr(
                                new_date,
                                "isoformat",
                            )
                            else new_date
                        ),
                        "reason": new_reason,
                        "account_id": str(new_destination_account_id),
                        "amount": str(new_amount),
                        "type": "received",
                    }
                )
                .eq("id", old_received["id"])
                .execute()
            )

            if not destination_transaction_response.data:
                raise Exception("Failed to update destination transaction")

            # ------------------------------------------------
            # Update all affected account balances
            # ------------------------------------------------

            affected_account_ids = set(balances.keys())

            for account_id in affected_account_ids:
                account_response = (
                    supabase.table("accounts")
                    .update({"current_balance": str(balances[account_id])})
                    .eq("id", account_id)
                    .execute()
                )

                if not account_response.data:
                    raise Exception("Failed to update account balance")

        except Exception:
            # -----------------------------------------------
            # Best-effort rollback of account balances
            # -----------------------------------------------

            for account_id, balance in original_balances.items():
                try:
                    (
                        supabase.table("accounts")
                        .update({"current_balance": str(balance)})
                        .eq("id", account_id)
                        .execute()
                    )
                except Exception:
                    pass

            # -----------------------------------------------
            # Best-effort rollback of source transaction
            # -----------------------------------------------

            try:
                (
                    supabase.table("transactions")
                    .update(
                        {
                            "transaction_date": (old_sent["transaction_date"]),
                            "reason": old_sent["reason"],
                            "account_id": str(old_source_account_id),
                            "amount": str(old_amount),
                            "type": "sent",
                        }
                    )
                    .eq("id", old_sent["id"])
                    .execute()
                )
            except Exception:
                pass

            # -----------------------------------------------
            # Best-effort rollback of destination transaction
            # -----------------------------------------------

            try:
                (
                    supabase.table("transactions")
                    .update(
                        {
                            "transaction_date": (old_received["transaction_date"]),
                            "reason": old_received["reason"],
                            "account_id": str(old_destination_account_id),
                            "amount": str(old_amount),
                            "type": "received",
                        }
                    )
                    .eq("id", old_received["id"])
                    .execute()
                )
            except Exception:
                pass

            # -----------------------------------------------
            # Best-effort rollback of transfer date
            # -----------------------------------------------

            try:
                (
                    supabase.table("transfers")
                    .update({"transfer_date": (existing_transfer["transfer_date"])})
                    .eq("id", str(transfer_id))
                    .execute()
                )
            except Exception:
                pass

            raise

        # ----------------------------------------------------
        # Return updated transfer
        # ----------------------------------------------------

        updated_transfer = get_transfer(transfer_id)

        updated_transactions = get_transfer_transactions(transfer_id)

        return {
            "transfer": updated_transfer,
            "transactions": updated_transactions,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# DELETE TRANSFER
# ============================================================


@router.delete("/{transfer_id}")
def delete_transfer(transfer_id: UUID):
    try:
        get_transfer(transfer_id)

        transactions = get_transfer_transactions(transfer_id)

        if len(transactions) != 2:
            raise HTTPException(
                status_code=500,
                detail="Transfer data is incomplete",
            )

        sent = next(
            (
                transaction
                for transaction in transactions
                if transaction["type"] == "sent"
            ),
            None,
        )

        received = next(
            (
                transaction
                for transaction in transactions
                if transaction["type"] == "received"
            ),
            None,
        )

        if not sent or not received:
            raise HTTPException(
                status_code=500,
                detail="Transfer transactions are invalid",
            )

        source_account_id = UUID(sent["account_id"])

        destination_account_id = UUID(received["account_id"])

        source_account = get_account(source_account_id)

        destination_account = get_account(destination_account_id)

        amount = Decimal(str(sent["amount"]))

        # ----------------------------------------------------
        # Calculate restored balances
        # ----------------------------------------------------

        source_new_balance = source_account["current_balance"] + amount

        destination_new_balance = destination_account["current_balance"] - amount

        # ----------------------------------------------------
        # Delete transactions
        # ----------------------------------------------------

        transaction_delete = (
            supabase.table("transactions")
            .delete()
            .eq(
                "transfer_id",
                str(transfer_id),
            )
            .execute()
        )

        if not transaction_delete.data:
            raise HTTPException(
                status_code=500,
                detail=("Failed to delete transfer transactions"),
            )

        try:
            # ------------------------------------------------
            # Restore source balance
            # ------------------------------------------------

            source_balance_response = (
                supabase.table("accounts")
                .update({"current_balance": str(source_new_balance)})
                .eq(
                    "id",
                    str(source_account_id),
                )
                .execute()
            )

            if not source_balance_response.data:
                raise Exception("Failed to restore source account balance")

            # ------------------------------------------------
            # Restore destination balance
            # ------------------------------------------------

            destination_balance_response = (
                supabase.table("accounts")
                .update({"current_balance": str(destination_new_balance)})
                .eq(
                    "id",
                    str(destination_account_id),
                )
                .execute()
            )

            if not destination_balance_response.data:
                raise Exception("Failed to restore destination account balance")

            # ------------------------------------------------
            # Delete transfer
            # ------------------------------------------------

            transfer_delete = (
                supabase.table("transfers")
                .delete()
                .eq(
                    "id",
                    str(transfer_id),
                )
                .execute()
            )

            if not transfer_delete.data:
                raise Exception("Failed to delete transfer")

        except Exception:
            # -----------------------------------------------
            # Best-effort restore of deleted transactions
            # -----------------------------------------------

            try:
                supabase.table("transactions").insert(
                    [
                        {
                            "id": sent["id"],
                            "transaction_date": (sent["transaction_date"]),
                            "reason": sent["reason"],
                            "category_id": (sent["category_id"]),
                            "account_id": (sent["account_id"]),
                            "amount": str(amount),
                            "type": "sent",
                            "transfer_id": str(transfer_id),
                        },
                        {
                            "id": received["id"],
                            "transaction_date": (received["transaction_date"]),
                            "reason": received["reason"],
                            "category_id": (received["category_id"]),
                            "account_id": (received["account_id"]),
                            "amount": str(amount),
                            "type": "received",
                            "transfer_id": str(transfer_id),
                        },
                    ]
                ).execute()
            except Exception:
                pass

            # Restore original balances
            try:
                (
                    supabase.table("accounts")
                    .update({"current_balance": str(source_account["current_balance"])})
                    .eq(
                        "id",
                        str(source_account_id),
                    )
                    .execute()
                )
            except Exception:
                pass

            try:
                (
                    supabase.table("accounts")
                    .update(
                        {"current_balance": str(destination_account["current_balance"])}
                    )
                    .eq(
                        "id",
                        str(destination_account_id),
                    )
                    .execute()
                )
            except Exception:
                pass

            raise

        return {"message": "Transfer deleted successfully"}

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
