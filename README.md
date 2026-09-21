# SaversStop

SaversStop is a personal finance dashboard built to help users track balances, spending, budgets, goals, and debt in one place. The app combines a FastAPI backend with a React + TypeScript frontend, and it uses Supabase as the persistence layer for financial data.

## Overview

This project is designed to give a user a centralized view of their finances, including:

- account balances and cash flow
- income and expense transactions
- budget tracking by category
- savings goals and progress
- debt relationships with people
- analytics and forecasting views

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Recharts
- Tailwind CSS
- Lucide React

### Backend
- Python
- FastAPI
- Supabase Python client
- Pydantic models
- Uvicorn

## Project Structure

```text
SaversStop/
├── backend/
│   ├── database/
│   │   ├── __init__.py
│   │   └── supabase.py
│   ├── models/
│   │   ├── account.py
│   │   ├── account_type.py
│   │   ├── category.py
│   │   ├── debt_interaction.py
│   │   ├── person.py
│   │   ├── transaction.py
│   │   ├── transfer.py
│   │   └── __init__.py
│   ├── routes/
│   │   ├── account_types.py
│   │   ├── accounts.py
│   │   ├── categories.py
│   │   ├── debt_interactions.py
│   │   ├── people.py
│   │   ├── transactions.py
│   │   ├── transfers.py
│   │   └── __init__.py
│   ├── .env
│   ├── main.py
│   └── __pycache__/
├── frontend/
│   ├── public/
│   │   └── data/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
├── README.md
├── .gitignore
└── .env.example (optional, if you add one later)
```

## Features

### Dashboard
The home page displays total funds and the balance split across active accounts using a donut chart.

### Accounts
Account records can be created, updated, and filtered by type and activity status.

### Transactions
The app supports tracking money movement with income and expense transactions, and the backend recalculates account balances to keep them consistent.

### Categories
Users can define categories that apply to spending and analytics.

### People and Debt
Debt relationships are tracked by person, including owed-to-me and I-owe flows.

### Analytics
The analytics view summarizes financial trends, spending patterns, savings, and monthly performance.

### Planning pages
The project also includes views for budgets, goals, forecasts, and a management flow for categories and goals.

## Backend API

The backend is served by FastAPI and exposes endpoints such as:

- `/api/accounts`
- `/api/account-types`
- `/api/transactions`
- `/api/categories`
- `/api/people`
- `/api/debt-interactions`
- `/api/transfers`

OpenAPI docs are available at:

- http://localhost:8000/docs
- http://localhost:8000/redoc

## Environment Setup

### Backend environment variables
Create a `.env` file in the `backend` folder with your Supabase project credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
```

These variables are loaded by `backend/database/supabase.py` and are required for the API to connect to the database.

## Running the Project

### 1) Start the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install fastapi uvicorn supabase python-dotenv
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will run at:

- http://localhost:8000

### 2) Start the frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:

- http://localhost:5173

## Development Notes

- The frontend connects to the backend at `http://127.0.0.1:8000`.
- Some pages may also fetch local data files from the frontend public folder for demo or mock data.
- The app is designed around a Supabase-backed data model, so valid credentials are required for live data operations.

## Typical Workflow

1. Start the FastAPI backend.
2. Start the Vite frontend.
3. Create accounts, categories, and people.
4. Record transactions and transfers.
5. Review dashboard and analytics data.
6. Manage budgets, goals, and debt tracking from the UI.

## Recommended Future Improvements

- user authentication and login
- recurring transactions
- CSV/PDF export
- stronger forecasting logic
- dark mode
- better mobile polish

## License

This project is intended for personal or internal use unless a separate license is provided by the owner.
