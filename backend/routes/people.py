from uuid import UUID

from fastapi import APIRouter, HTTPException

from database.supabase import supabase
from models.person import PersonCreate, PersonUpdate

router = APIRouter(
    prefix="/api/people",
    tags=["People"],
)


PERSON_SELECT = """
    id,
    name,
    active,
    created_at,
    updated_at
"""


# =========================================================
# GET ALL PEOPLE
# =========================================================


@router.get("")
def get_people():
    try:
        response = (
            supabase.table("people").select(PERSON_SELECT).order("name").execute()
        )

        return {"people": response.data or []}

    except Exception as error:
        print(f"Error getting people: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# GET PERSON BY ID
# =========================================================


@router.get("/{person_id}")
def get_person(person_id: UUID):
    try:
        response = (
            supabase.table("people")
            .select(PERSON_SELECT)
            .eq("id", str(person_id))
            .limit(1)
            .execute()
        )

        people = response.data or []

        if not people:
            raise HTTPException(
                status_code=404,
                detail="Person not found",
            )

        return people[0]

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error getting person: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# CREATE PERSON
# =========================================================


@router.post("", status_code=201)
def create_person(person: PersonCreate):
    try:
        person_name = person.name.strip()

        if not person_name:
            raise HTTPException(
                status_code=400,
                detail="Person name cannot be empty.",
            )

        # ---------------------------------------------
        # Check for duplicate name
        # ---------------------------------------------

        existing_response = (
            supabase.table("people")
            .select("id")
            .ilike("name", person_name)
            .limit(1)
            .execute()
        )

        existing_people = existing_response.data or []

        if existing_people:
            raise HTTPException(
                status_code=409,
                detail="A person with this name already exists.",
            )

        # ---------------------------------------------
        # Create person
        # ---------------------------------------------

        response = (
            supabase.table("people")
            .insert(
                {
                    "name": person_name,
                    "active": person.active,
                }
            )
            .select(PERSON_SELECT)
            .execute()
        )

        created_people = response.data or []

        if not created_people:
            raise HTTPException(
                status_code=500,
                detail="Person was not created.",
            )

        return created_people[0]

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error creating person: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# UPDATE PERSON
# =========================================================


@router.patch("/{person_id}")
def update_person(
    person_id: UUID,
    person: PersonUpdate,
):
    try:
        # ---------------------------------------------
        # Check person exists
        # ---------------------------------------------

        existing_response = (
            supabase.table("people")
            .select("id")
            .eq("id", str(person_id))
            .limit(1)
            .execute()
        )

        existing_people = existing_response.data or []

        if not existing_people:
            raise HTTPException(
                status_code=404,
                detail="Person not found",
            )

        # ---------------------------------------------
        # Build update data
        # ---------------------------------------------

        update_data = {}

        if person.name is not None:
            person_name = person.name.strip()

            if not person_name:
                raise HTTPException(
                    status_code=400,
                    detail="Person name cannot be empty.",
                )

            update_data["name"] = person_name

        if person.active is not None:
            update_data["active"] = person.active

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields provided for update.",
            )

        # ---------------------------------------------
        # Check duplicate name
        # ---------------------------------------------

        if person.name is not None:
            duplicate_response = (
                supabase.table("people")
                .select("id")
                .ilike("name", person.name.strip())
                .neq("id", str(person_id))
                .limit(1)
                .execute()
            )

            duplicate_people = duplicate_response.data or []

            if duplicate_people:
                raise HTTPException(
                    status_code=409,
                    detail="A person with this name already exists.",
                )

        # ---------------------------------------------
        # Update person
        # ---------------------------------------------

        response = (
            supabase.table("people")
            .update(update_data)
            .eq("id", str(person_id))
            .select(PERSON_SELECT)
            .execute()
        )

        updated_people = response.data or []

        if not updated_people:
            raise HTTPException(
                status_code=500,
                detail="Person was not updated.",
            )

        return updated_people[0]

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error updating person: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# DELETE PERSON
# =========================================================


@router.delete("/{person_id}")
def delete_person(person_id: UUID):
    try:
        # ---------------------------------------------
        # Check person exists
        # ---------------------------------------------

        existing_response = (
            supabase.table("people")
            .select("id")
            .eq("id", str(person_id))
            .limit(1)
            .execute()
        )

        existing_people = existing_response.data or []

        if not existing_people:
            raise HTTPException(
                status_code=404,
                detail="Person not found",
            )

        # ---------------------------------------------
        # Delete person
        # ---------------------------------------------

        supabase.table("people").delete().eq("id", str(person_id)).execute()

        return {"message": "Person deleted successfully."}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error deleting person: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
