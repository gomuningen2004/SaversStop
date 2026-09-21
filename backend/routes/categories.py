from uuid import UUID

from fastapi import APIRouter, HTTPException

from database.supabase import supabase
from models.category import (
    CategoryCreate,
    CategoryUpdate,
)

router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"],
)


CATEGORY_SELECT = """
    id,
    name,
    active,
    created_at,
    updated_at
"""


# =========================================================
# GET ALL CATEGORIES
# =========================================================


@router.get("")
def get_categories():
    try:
        response = (
            supabase.table("categories").select(CATEGORY_SELECT).order("name").execute()
        )

        return {"categories": response.data or []}

    except Exception as error:
        print(f"Error getting categories: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# GET ONE CATEGORY
# =========================================================


@router.get("/{category_id}")
def get_category(category_id: UUID):
    try:
        response = (
            supabase.table("categories")
            .select(CATEGORY_SELECT)
            .eq("id", str(category_id))
            .limit(1)
            .execute()
        )

        categories = response.data or []

        if not categories:
            raise HTTPException(
                status_code=404,
                detail="Category not found",
            )

        return categories[0]

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error getting category: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# CREATE CATEGORY
# =========================================================


@router.post("", status_code=201)
def create_category(category: CategoryCreate):
    try:
        category_name = category.name.strip()

        # -------------------------------------------------
        # Validate name
        # -------------------------------------------------

        if not category_name:
            raise HTTPException(
                status_code=400,
                detail="Category name cannot be empty.",
            )

        # -------------------------------------------------
        # Check for duplicate category name
        # -------------------------------------------------

        existing_response = (
            supabase.table("categories")
            .select("id")
            .ilike("name", category_name)
            .limit(1)
            .execute()
        )

        existing_categories = existing_response.data or []

        if existing_categories:
            raise HTTPException(
                status_code=409,
                detail="A category with this name already exists.",
            )

        # -------------------------------------------------
        # Create category
        # -------------------------------------------------

        response = (
            supabase.table("categories")
            .insert(
                {
                    "name": category_name,
                    "active": category.active,
                }
            )
            .select(CATEGORY_SELECT)
            .execute()
        )

        created_categories = response.data or []

        if not created_categories:
            raise HTTPException(
                status_code=500,
                detail="Category was not created.",
            )

        return created_categories[0]

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error creating category: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# UPDATE CATEGORY
# =========================================================


@router.patch("/{category_id}")
def update_category(
    category_id: UUID,
    category: CategoryUpdate,
):
    try:
        # -------------------------------------------------
        # Make sure category exists
        # -------------------------------------------------

        existing_response = (
            supabase.table("categories")
            .select("id")
            .eq("id", str(category_id))
            .limit(1)
            .execute()
        )

        existing_categories = existing_response.data or []

        if not existing_categories:
            raise HTTPException(
                status_code=404,
                detail="Category not found",
            )

        # -------------------------------------------------
        # Build update data
        # -------------------------------------------------

        update_data = {}

        if category.name is not None:
            category_name = category.name.strip()

            if not category_name:
                raise HTTPException(
                    status_code=400,
                    detail="Category name cannot be empty.",
                )

            update_data["name"] = category_name

        if category.active is not None:
            update_data["active"] = category.active

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields provided for update.",
            )

        # -------------------------------------------------
        # Check duplicate name
        # -------------------------------------------------

        if category.name is not None:
            duplicate_response = (
                supabase.table("categories")
                .select("id")
                .ilike("name", category.name.strip())
                .neq("id", str(category_id))
                .limit(1)
                .execute()
            )

            duplicate_categories = duplicate_response.data or []

            if duplicate_categories:
                raise HTTPException(
                    status_code=409,
                    detail="A category with this name already exists.",
                )

        # -------------------------------------------------
        # Update category
        # -------------------------------------------------

        response = (
            supabase.table("categories")
            .update(update_data)
            .eq("id", str(category_id))
            .select(CATEGORY_SELECT)
            .execute()
        )

        updated_categories = response.data or []

        if not updated_categories:
            raise HTTPException(
                status_code=500,
                detail="Category was not updated.",
            )

        return updated_categories[0]

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error updating category: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# DELETE CATEGORY
# =========================================================


@router.delete("/{category_id}")
def delete_category(category_id: UUID):
    try:
        # -------------------------------------------------
        # Make sure category exists
        # -------------------------------------------------

        existing_response = (
            supabase.table("categories")
            .select("id")
            .eq("id", str(category_id))
            .limit(1)
            .execute()
        )

        existing_categories = existing_response.data or []

        if not existing_categories:
            raise HTTPException(
                status_code=404,
                detail="Category not found",
            )

        # -------------------------------------------------
        # Delete category
        #
        # PostgreSQL may reject this if transactions or
        # budgets reference this category.
        # -------------------------------------------------

        supabase.table("categories").delete().eq("id", str(category_id)).execute()

        return {"message": "Category deleted successfully."}

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error deleting category: {error}")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
