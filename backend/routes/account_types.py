from fastapi import APIRouter, HTTPException

from database.supabase import supabase

router = APIRouter(
    prefix="/api/account-types",
    tags=["Account Types"],
)


@router.get("")
def get_account_types():
    try:
        response = supabase.table("account_types").select("""
                id,
                name,
                classification,
                active
                """).order("name").execute()

        return {"accountTypes": response.data}

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
