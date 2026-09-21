from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.accounts import router as accounts_router
from routes.account_types import router as account_types_router
from routes.transactions import router as transactions_router
from routes.transfers import router as transfers_router
from routes.categories import router as categories_router
from routes.people import router as people_router
from routes.debt_interactions import router as debt_interactions_router
from routes.goals import router as goals_router
from routes.forecast import router as forecast_router

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(accounts_router)
app.include_router(account_types_router)
app.include_router(transactions_router)
app.include_router(transfers_router)
app.include_router(categories_router)
app.include_router(people_router)
app.include_router(debt_interactions_router)
app.include_router(goals_router)
app.include_router(forecast_router)


@app.get("/")
def root():
    return {"message": "SaversStop API is running"}
