from fastapi import APIRouter, HTTPException, Query

from models.forecast import ForecastResponse
from services.forecast import build_forecast

router = APIRouter(
    prefix="/api/forecast",
    tags=["Forecast"],
)


# ============================================================
# GET FORECAST
# ============================================================


@router.get(
    "",
    response_model=ForecastResponse,
)
def get_forecast(
    months: int = Query(
        default=3,
        ge=1,
        le=12,
    ),
    history_months: int = Query(
        default=6,
        ge=3,
        le=24,
    ),
):
    """
    Calculate the user's financial forecast.

    Parameters:

    months:
        Number of future months to forecast.

    history_months:
        Number of completed historical months used
        to calculate the weighted averages.
    """

    try:
        return build_forecast(
            months=months,
            history_months=history_months,
        )

    except HTTPException:
        raise

    except Exception as error:

        print(f"Error generating financial forecast: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to generate financial forecast",
        )
