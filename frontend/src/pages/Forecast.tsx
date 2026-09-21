import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Info,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import type { Account, Goal, Transaction } from '../types';

type RawAccount = {
  id: string;
  name: string;
  account_type_id: string;
  current_balance: number;
  active: boolean;
};

type RawTransaction = {
  id: string;
  transaction_date: string;
  reason?: string | null;
  category_id: string;
  account_id: string;
  amount: number;
  type: 'sent' | 'received';
  transfer_id?: string | null;
};

type RawGoal = {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  monthly_contribution: number;
  target_date: string;
  status: 'active' | 'completed';
};

type ForecastMonth = {
  month: string;
  label: string;
  startingBalance: number;
  endingBalance: number;
  historicalSpending: number;
  expectedIncome: number;
  expectedExpenses: number;
  goalContributions: number;
  netChange: number;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

const formatCompactCurrency = (amount: number) => {
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(amount);
};

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function getMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-');

  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

function getRecentMonths(count: number) {
  const months: string[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    months.push(`${year}-${month}`);
  }

  return months;
}

function Forecast() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  /*
   * ---------------------------------------------------------
   * LOAD DATA
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsResponse, transactionsResponse, goalsResponse] =
          await Promise.all([
            fetch('/data/accounts.json'),
            fetch('/data/transactions.json'),
            fetch('/data/goals.json'),
          ]);

        if (!accountsResponse.ok) {
          throw new Error(
            `Accounts request failed: ${accountsResponse.status}`,
          );
        }

        if (!transactionsResponse.ok) {
          throw new Error(
            `Transactions request failed: ${transactionsResponse.status}`,
          );
        }

        if (!goalsResponse.ok) {
          throw new Error(`Goals request failed: ${goalsResponse.status}`);
        }

        const accountsData = (await accountsResponse.json()) as {
          accounts: RawAccount[];
        };

        const transactionsData = (await transactionsResponse.json()) as {
          transactions: RawTransaction[];
        };

        const goalsData = (await goalsResponse.json()) as {
          goals: RawGoal[];
        };

        /*
         * -----------------------------------------------------
         * NORMALIZE ACCOUNTS
         * -----------------------------------------------------
         */

        const normalizedAccounts: Account[] = accountsData.accounts.map(
          (account) => ({
            id: account.id,
            name: account.name,
            accountTypeId: account.account_type_id,
            currentBalance: Number(account.current_balance),
            active: account.active,
          }),
        );

        /*
         * -----------------------------------------------------
         * NORMALIZE TRANSACTIONS
         * -----------------------------------------------------
         */

        const normalizedTransactions: Transaction[] =
          transactionsData.transactions.map((transaction) => ({
            id: transaction.id,
            transactionDate: transaction.transaction_date,
            reason: transaction.reason ?? null,
            categoryId: transaction.category_id,
            accountId: transaction.account_id,
            amount: Number(transaction.amount),
            type: transaction.type,
            transferId: transaction.transfer_id ?? null,
          }));

        /*
         * -----------------------------------------------------
         * NORMALIZE GOALS
         * -----------------------------------------------------
         */

        const normalizedGoals: Goal[] = goalsData.goals.map((goal) => ({
          id: goal.id,
          name: goal.name,
          targetAmount: Number(goal.target_amount),
          savedAmount: Number(goal.saved_amount),
          monthlyContribution: Number(goal.monthly_contribution),
          targetDate: goal.target_date,
          status: goal.status,
        }));

        setAccounts(normalizedAccounts);
        setTransactions(normalizedTransactions);
        setGoals(normalizedGoals);

        console.log('Forecast accounts:', normalizedAccounts);

        console.log('Forecast transactions:', normalizedTransactions);

        console.log('Forecast goals:', normalizedGoals);
      } catch (error) {
        console.error('Failed to load forecast data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * ---------------------------------------------------------
   * CURRENT BALANCE
   *
   * Asset accounts increase the available balance.
   * Liability accounts are not currently included because
   * account classification is not loaded on this page.
   *
   * For now, use all active account current balances.
   * ---------------------------------------------------------
   */

  const currentBalance = useMemo(() => {
    return accounts
      .filter((account) => account.active)
      .reduce((total, account) => total + account.currentBalance, 0);
  }, [accounts]);

  /*
   * ---------------------------------------------------------
   * FINANCIAL TRANSACTIONS
   *
   * Self transfers are excluded.
   * ---------------------------------------------------------
   */

  const financialTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) => transaction.transferId === null,
    );
  }, [transactions]);

  /*
   * ---------------------------------------------------------
   * HISTORICAL MONTHLY SPENDING
   *
   * Calculate the average monthly spending from
   * actual historical transactions.
   *
   * Only completed months are used when possible.
   * ---------------------------------------------------------
   */

  const historicalMonthlySpending = useMemo(() => {
    const monthlyExpenses = new Map<string, number>();

    financialTransactions
      .filter((transaction) => transaction.type === 'sent')
      .forEach((transaction) => {
        const month = getMonthKey(transaction.transactionDate);

        const current = monthlyExpenses.get(month) ?? 0;

        monthlyExpenses.set(month, current + transaction.amount);
      });

    const values = Array.from(monthlyExpenses.values());

    if (values.length === 0) {
      return 0;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
  }, [financialTransactions]);

  /*
   * ---------------------------------------------------------
   * HISTORICAL MONTHLY INCOME
   * ---------------------------------------------------------
   */

  const historicalMonthlyIncome = useMemo(() => {
    const monthlyIncome = new Map<string, number>();

    financialTransactions
      .filter((transaction) => transaction.type === 'received')
      .forEach((transaction) => {
        const month = getMonthKey(transaction.transactionDate);

        const current = monthlyIncome.get(month) ?? 0;

        monthlyIncome.set(month, current + transaction.amount);
      });

    const values = Array.from(monthlyIncome.values());

    if (values.length === 0) {
      return 0;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
  }, [financialTransactions]);

  /*
   * ---------------------------------------------------------
   * GOAL CONTRIBUTIONS
   *
   * Only active goals with a future target date are included.
   * ---------------------------------------------------------
   */

  const monthlyGoalContributions = useMemo(() => {
    return goals
      .filter(
        (goal) => goal.status === 'active' && goal.monthlyContribution > 0,
      )
      .reduce((total, goal) => total + goal.monthlyContribution, 0);
  }, [goals]);

  /*
   * ---------------------------------------------------------
   * CURRENT MONTH ACTUALS
   * ---------------------------------------------------------
   */

  const currentMonthKey = useMemo(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
  }, []);

  const currentMonthIncome = useMemo(() => {
    return financialTransactions
      .filter(
        (transaction) =>
          transaction.type === 'received' &&
          getMonthKey(transaction.transactionDate) === currentMonthKey,
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [financialTransactions, currentMonthKey]);

  const currentMonthExpenses = useMemo(() => {
    return financialTransactions
      .filter(
        (transaction) =>
          transaction.type === 'sent' &&
          getMonthKey(transaction.transactionDate) === currentMonthKey,
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [financialTransactions, currentMonthKey]);

  /*
   * ---------------------------------------------------------
   * FORECAST
   *
   * Recurring transactions are intentionally NOT used.
   *
   * Expected monthly expenses:
   * historical average spending.
   *
   * Expected monthly income:
   * historical average income.
   *
   * Goal contributions:
   * active goal monthly contributions.
   * ---------------------------------------------------------
   */

  const forecastMonths = useMemo<ForecastMonth[]>(() => {
    const months = getRecentMonths(3);

    let balance = currentBalance;

    return months.map((month, index) => {
      const expectedIncome =
        index === 0 && currentMonthIncome > 0
          ? currentMonthIncome
          : historicalMonthlyIncome;

      const expectedExpenses =
        index === 0 && currentMonthExpenses > 0
          ? currentMonthExpenses
          : historicalMonthlySpending;

      const goalContributions = monthlyGoalContributions;

      const netChange = expectedIncome - expectedExpenses - goalContributions;

      const startingBalance = balance;

      const endingBalance = startingBalance + netChange;

      balance = endingBalance;

      return {
        month,
        label: getMonthLabel(month),
        startingBalance,
        endingBalance,
        historicalSpending: historicalMonthlySpending,
        expectedIncome,
        expectedExpenses,
        goalContributions,
        netChange,
      };
    });
  }, [
    currentBalance,
    currentMonthIncome,
    currentMonthExpenses,
    historicalMonthlyIncome,
    historicalMonthlySpending,
    monthlyGoalContributions,
  ]);

  const forecast = useMemo(() => {
    const firstMonth = forecastMonths[0];

    return {
      currentBalance,
      currentMonthIncome,
      currentMonthExpenses,
      endOfMonthForecast: firstMonth?.endingBalance ?? currentBalance,
      forecastMonths,
    };
  }, [
    currentBalance,
    currentMonthIncome,
    currentMonthExpenses,
    forecastMonths,
  ]);

  useEffect(() => {
    document.title = 'Financial Forecast | SaversStop';
  }, []);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-slate-500">Loading forecast...</p>
      </main>
    );
  }

  const currentMonth = forecast.forecastMonths[0];

  const monthlyNet = currentMonth?.netChange ?? 0;

  return (
    <main className="min-h-screen px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Financial Forecast
              </h1>

              <p className="text-sm text-slate-500">
                See where your finances are heading.
              </p>
            </div>
          </div>
        </div>

        {/* CURRENT POSITION */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">This month</h2>

            <p className="text-sm text-slate-500">
              Your current position and expected end-of-month result.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Wallet size={16} />
                Current balance
              </div>

              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {formatCurrency(forecast.currentBalance)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <ArrowUpRight size={16} className="text-emerald-500" />
                Actual income
              </div>

              <p className="mt-3 text-2xl font-semibold text-emerald-600">
                {formatCurrency(forecast.currentMonthIncome)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <ArrowDownRight size={16} className="text-red-500" />
                Actual spending
              </div>

              <p className="mt-3 text-2xl font-semibold text-red-600">
                {formatCurrency(forecast.currentMonthExpenses)}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <TrendingUp size={16} />
                End-of-month forecast
              </div>

              <p className="mt-3 text-2xl font-semibold text-indigo-900">
                {formatCurrency(forecast.endOfMonthForecast)}
              </p>
            </div>
          </div>
        </section>

        {/* FORECAST EXPLANATION */}

        {currentMonth && (
          <section className="mb-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Info size={18} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    How this month's forecast works
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    SaversStop uses your historical transaction activity and
                    active goal contributions to estimate your future balance.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Expected income</p>

                  <p className="mt-1 text-lg font-semibold text-emerald-600">
                    {formatCurrency(currentMonth.expectedIncome)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Expected expenses</p>

                  <p className="mt-1 text-lg font-semibold text-red-600">
                    {formatCurrency(currentMonth.expectedExpenses)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Planned goals</p>

                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {formatCurrency(currentMonth.goalContributions)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Expected net change</p>

                  <p
                    className={`mt-1 text-lg font-semibold ${
                      monthlyNet >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {monthlyNet >= 0 ? '+' : ''}
                    {formatCurrency(monthlyNet)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3 MONTH FORECAST */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Next 3 months
            </h2>

            <p className="text-sm text-slate-500">
              Estimated balance based on your current financial patterns.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {forecast.forecastMonths.map((month, index) => {
              const positive = month.netChange >= 0;

              return (
                <div
                  key={month.month}
                  className={`rounded-2xl border bg-white p-6 ${
                    index === 0
                      ? 'border-indigo-200 ring-1 ring-indigo-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {index === 0
                          ? 'This month'
                          : index === 1
                            ? 'Next month'
                            : 'Following month'}
                      </p>

                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {month.label}
                      </h3>
                    </div>

                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        positive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {positive ? (
                        <TrendingUp size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      )}
                    </div>
                  </div>

                  <p className="mt-6 text-2xl font-semibold text-slate-900">
                    {formatCurrency(month.endingBalance)}
                  </p>

                  <p
                    className={`mt-1 text-sm font-medium ${
                      positive ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {positive ? '+' : ''}
                    {formatCurrency(month.netChange)} expected change
                  </p>

                  <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Expected income</span>

                      <span className="font-medium text-emerald-600">
                        {formatCompactCurrency(month.expectedIncome)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Expected expenses</span>

                      <span className="font-medium text-red-600">
                        {formatCompactCurrency(month.expectedExpenses)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Goal contributions</span>

                      <span className="font-medium text-slate-700">
                        {formatCompactCurrency(month.goalContributions)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* BREAKDOWN */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Forecast breakdown
            </h2>

            <p className="text-sm text-slate-500">
              The factors SaversStop is using to estimate your future balance.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-5">
              <div>Month</div>
              <div>Historical spending</div>
              <div>Goals</div>
              <div>Expected income</div>
              <div>Forecast balance</div>
            </div>

            {forecast.forecastMonths.map((month) => (
              <div
                key={month.month}
                className="grid grid-cols-2 gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 md:grid-cols-5 md:items-center"
              >
                <div>
                  <p className="font-medium text-slate-900">{month.label}</p>

                  <p className="mt-1 text-xs text-slate-500">
                    Starting: {formatCompactCurrency(month.startingBalance)}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-slate-800">
                    {formatCurrency(month.historicalSpending)}
                  </p>

                  <p className="text-xs text-slate-400">monthly average</p>
                </div>

                <div>
                  <p className="font-medium text-slate-800">
                    {formatCurrency(month.goalContributions)}
                  </p>

                  <p className="text-xs text-slate-400">planned</p>
                </div>

                <div>
                  <p className="font-medium text-emerald-600">
                    {formatCurrency(month.expectedIncome)}
                  </p>

                  <p className="text-xs text-slate-400">expected</p>
                </div>

                <div>
                  <p className="font-semibold text-indigo-700">
                    {formatCurrency(month.endingBalance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* METHODOLOGY */}

        <section className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex gap-3">
              <CalendarDays
                size={18}
                className="mt-0.5 shrink-0 text-slate-500"
              />

              <div>
                <p className="font-medium text-slate-800">
                  Forecast methodology
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  SaversStop uses your historical transaction history to
                  estimate normal monthly income and spending. Active goals are
                  then deducted as planned monthly contributions. Self transfers
                  are excluded because they do not change your overall wealth.
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Recurring transactions are not currently included in the
                  forecast. This forecast is an estimate, not a prediction of
                  exact future transactions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Forecast;
