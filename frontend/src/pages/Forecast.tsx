import { useEffect, useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Info,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import type {
  Account,
  Goal,
  RecurringTransaction,
  Transaction,
} from '../types';

import accountsData from '../../public/data/accounts.json';
import transactionsData from '../../public/data/transactions.json';
import recurringData from '../../public/data/recurringTransactions.json';
import goalsData from '../../public/data/goals.json';

import { calculateForecast } from '../utils/forecast';

const accounts = accountsData.accounts as Account[];

const transactions = transactionsData.transactions as Transaction[];

const recurringTransactions =
  recurringData.recurringTransactions as RecurringTransaction[];

const goals = goalsData.goals as Goal[];

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

function Forecast() {
  const forecast = useMemo(
    () =>
      calculateForecast(
        accounts,
        transactions,
        recurringTransactions,
        goals,
        3,
      ),
    [],
  );

  useEffect(() => {
    document.title = 'Financial Forecast | SaversStop';
  }, []);

  const currentMonth = forecast.forecastMonths[0];

  //   const futureMonths = forecast.forecastMonths.slice(1);

  const monthlyNet = currentMonth?.netChange ?? 0;

  return (
    <main className="min-h-screen px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
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

        {/* Current position */}
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

        {/* Forecast explanation */}
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
                    SaversStop combines your actual transactions with historical
                    spending, recurring transactions, and planned goal
                    contributions.
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

        {/* 3 month forecast */}
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

        {/* Breakdown */}
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
              <div>Recurring</div>
              <div>Goals</div>
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
                    {formatCurrency(month.recurringExpenses)}
                  </p>

                  <p className="text-xs text-slate-400">expenses</p>
                </div>

                <div>
                  <p className="font-medium text-slate-800">
                    {formatCurrency(month.goalContributions)}
                  </p>

                  <p className="text-xs text-slate-400">planned</p>
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

        {/* Methodology */}
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
                  SaversStop currently uses your recent transaction history to
                  estimate normal monthly spending, then adds recurring
                  transactions and planned goal contributions. Self transfers
                  are excluded because they do not change your overall wealth.
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This is an estimate, not a prediction of exact future
                  transactions.
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
