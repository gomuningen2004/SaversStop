# SaversStop

SaversStop is a personal finance dashboard for tracking accounts, transactions, budgets, categories, savings goals, and debts. The frontend is built with React and TypeScript; the API is built with FastAPI and uses Supabase for persistence.

## Features

- **Dashboard:** Current funds across active accounts.
- **Accounts:** Asset and liability accounts, with account types, balances, and net worth.
- **Transactions:** Income, expenses, and transfers, with date filtering and pagination.
- **Budgets:** Monthly category budgets and spending status.
- **Categories:** Category spending views and category management.
- **Analytics:** Income, expenses, savings, spending by category, and monthly trends.
- **Forecast:** Current financial position, forecast breakdowns, and projections.
- **Goals:** Savings goals and contribution tracking.
- **People:** Debt balances, payments, debt history, and person management.

## Tech stack

### Frontend

- React 19 and TypeScript
- Vite
- React Router
- Recharts
- Tailwind CSS
- Lucide React

### Backend

- Python and FastAPI
- Supabase Python client
- Pydantic
- Uvicorn
- python-dotenv

## Project structure

```text
SaversStop/
├── backend/
│   ├── database/             # Supabase client setup
│   ├── models/               # Pydantic request/response models
│   ├── routes/               # FastAPI route modules
│   ├── services/             # Backend service logic
│   └── main.py               # FastAPI application
├── frontend/
│   ├── public/               # Static frontend assets
│   ├── src/
│   │   ├── components/       # Components grouped by page
│   │   │   ├── accounts/
│   │   │   ├── analytics/
│   │   │   ├── budgets/
│   │   │   ├── categories/
│   │   │   ├── dashboard/
│   │   │   ├── forecast/
│   │   │   ├── goals/
│   │   │   ├── people/
│   │   │   └── transactions/
│   │   ├── hooks/            # Reusable React hooks
│   │   ├── pages/            # Page-level containers
│   │   ├── utils/            # Shared calculations and helpers
│   │   ├── App.tsx           # Routes and application shell
│   │   └── types.ts          # Shared frontend types
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Requirements

- Python 3.10 or later
- Node.js and npm
- A Supabase project

## Configuration

Create `backend/.env` with your Supabase project URL and key:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
```

The backend loads these values from the environment when it initializes the Supabase client. Keep credentials private and do not commit the `.env` file.

## Run locally

Start the backend in one terminal:

```bash
cd backend
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
# .venv\Scripts\Activate.ps1

python -m pip install fastapi uvicorn supabase python-dotenv
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at <http://localhost:5173> and the API at <http://localhost:8000>.

## API documentation

FastAPI's interactive API documentation is available at:

- <http://localhost:8000/docs>
- <http://localhost:8000/redoc>

The API includes routes for accounts, account types, transactions, transfers, categories, people, debt interactions, goals, and forecasts.

## Development commands

Run from `frontend/`:

```bash
npm run lint
npm run build
```
