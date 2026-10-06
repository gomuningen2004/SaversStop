import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { Category, CategoriesResponse, Transaction } from '../types';

const API_URL = 'http://127.0.0.1:8000';

/* Categories hidden from the spending breakdown (compared in lowercase). */
const EXCLUDED_CATEGORIES = new Set(['unknown', 'other']);

/* Donut shows the top N categories; everything else is grouped together. */
const MAX_DONUT_SLICES = 7;
const REMAINING_COLOR = '#cbd5e1';

const chartColors = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

type CategorySpending = {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
};

type MonthlyData = {
  month: string;
  label: string;
  income: number;
  expenses: number;
};

/* Shape returned by the backend (snake_case). */
type ApiTransaction = {
  id: string;
  transaction_date: string;
  reason?: string | null;
  category_id: string | null;
  account_id: string;
  amount: number | string;
  type: 'sent' | 'received';
  transfer_id?: string | null;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatSigned = (amount: number) =>
  `${amount < 0 ? '-' : ''}${formatCurrency(Math.abs(amount))}`;

const getMonthKey = (date: string) => date.slice(0, 7);

function formatMonth(month: string) {
  const [year, monthNumber] = month.split('-');
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function getRecentMonths(count: number) {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (count - 1 - index),
      1,
    );
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${date.getFullYear()}-${month}`;
  });
}

function Analytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  /* Load transactions + categories */

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_URL}/api/transactions`),
          fetch(`${API_URL}/api/categories`),
        ]);

        if (!transactionsResponse.ok) {
          throw new Error(
            `Transactions request failed: ${transactionsResponse.status}`,
          );
        }

        if (!categoriesResponse.ok) {
          throw new Error(
            `Categories request failed: ${categoriesResponse.status}`,
          );
        }

        const transactionsData = (await transactionsResponse.json()) as {
          transactions: ApiTransaction[];
        };
        const categoriesData =
          (await categoriesResponse.json()) as CategoriesResponse;

        /* snake_case (backend) -> camelCase (frontend) */
        setTransactions(
          transactionsData.transactions.map((transaction) => ({
            id: transaction.id,
            transactionDate: transaction.transaction_date,
            reason: transaction.reason ?? null,
            categoryId: transaction.category_id ?? '',
            accountId: transaction.account_id,
            amount: Number(transaction.amount),
            type: transaction.type,
            transferId: transaction.transfer_id ?? null,
          })),
        );

        setCategories(
          categoriesData.categories.map((category) => ({
            id: category.id,
            name: category.name,
            active: category.active,
          })),
        );
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * Self transfers stay in the history but must not count
   * as income or expenses.
   */
  const financialTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.transferId === null),
    [transactions],
  );

  /* Summary */

  const totalIncome = useMemo(
    () =>
      financialTransactions
        .filter((transaction) => transaction.type === 'received')
        .reduce((total, transaction) => total + transaction.amount, 0),
    [financialTransactions],
  );

  const totalExpenses = useMemo(
    () =>
      financialTransactions
        .filter((transaction) => transaction.type === 'sent')
        .reduce((total, transaction) => total + transaction.amount, 0),
    [financialTransactions],
  );

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome === 0 ? 0 : (netSavings / totalIncome) * 100;

  /* Spending by category */

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const categorySpending = useMemo<CategorySpending[]>(() => {
    const spending = new Map<string, number>();

    financialTransactions
      .filter((transaction) => transaction.type === 'sent')
      .forEach((transaction) => {
        const current = spending.get(transaction.categoryId) ?? 0;
        spending.set(transaction.categoryId, current + transaction.amount);
      });

    const visible = Array.from(spending.entries())
      .map(([categoryId, amount]) => ({
        id: categoryId,
        name: categoryMap.get(categoryId) ?? 'Unknown',
        amount,
      }))
      .filter(({ name }) => !EXCLUDED_CATEGORIES.has(name.toLowerCase()))
      .sort((a, b) => b.amount - a.amount);

    /* Percentages are relative to the categories actually shown. */
    const total = visible.reduce((sum, { amount }) => sum + amount, 0);

    return visible.map((category, index) => ({
      ...category,
      percentage: total > 0 ? (category.amount / total) * 100 : 0,
      color:
        index < MAX_DONUT_SLICES
          ? chartColors[index % chartColors.length]
          : REMAINING_COLOR,
    }));
  }, [financialTransactions, categoryMap]);

  /* Donut: top categories + one grouped "Misc" slice */

  const donutData = useMemo<CategorySpending[]>(() => {
    const top = categorySpending.slice(0, MAX_DONUT_SLICES);
    const rest = categorySpending.slice(MAX_DONUT_SLICES);

    if (rest.length === 0) {
      return top;
    }

    return [
      ...top,
      {
        id: 'misc',
        name: 'Misc',
        amount: rest.reduce((sum, { amount }) => sum + amount, 0),
        percentage: rest.reduce((sum, { percentage }) => sum + percentage, 0),
        color: REMAINING_COLOR,
      },
    ];
  }, [categorySpending]);

  /* Income vs expenses, last 12 months */

  const monthlyData = useMemo<MonthlyData[]>(() => {
    const months = getRecentMonths(12);
    const monthly = new Map(
      months.map((month) => [month, { income: 0, expenses: 0 }]),
    );

    financialTransactions.forEach((transaction) => {
      const entry = monthly.get(getMonthKey(transaction.transactionDate));

      if (!entry) {
        return;
      }

      if (transaction.type === 'received') {
        entry.income += transaction.amount;
      } else {
        entry.expenses += transaction.amount;
      }
    });

    return months.map((month) => ({
      month,
      label: formatMonth(month),
      ...monthly.get(month)!,
    }));
  }, [financialTransactions]);

  if (loading) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-slate-500">Loading analytics...</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>

          <p className="mt-1 text-sm text-slate-500">
            Understand where your money is going.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <ArrowDownLeft size={19} />
              </div>

              <p className="text-sm font-medium text-slate-500">Total Income</p>
            </div>

            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <ArrowUpRight size={19} />
              </div>

              <p className="text-sm font-medium text-slate-500">
                Total Expenses
              </p>
            </div>

            <p className="text-2xl font-semibold text-red-600">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <PiggyBank size={19} />
              </div>

              <p className="text-sm font-medium text-slate-500">Net Savings</p>
            </div>

            <p
              className={`text-2xl font-semibold ${
                netSavings >= 0 ? 'text-slate-900' : 'text-red-600'
              }`}
            >
              {formatSigned(netSavings)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp size={19} />
              </div>

              <p className="text-sm font-medium text-slate-500">Savings Rate</p>
            </div>

            <p
              className={`text-2xl font-semibold ${
                savingsRate >= 0 ? 'text-slate-900' : 'text-red-600'
              }`}
            >
              {savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* SPENDING BY CATEGORY */}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Spending by Category
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Where your money has been going.
            </p>
          </div>

          {categorySpending.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">
                No spending data available.
              </p>
            </div>
          ) : (
            <div className="grid items-center gap-8 lg:grid-cols-2">
              {/* DONUT (the list on the right acts as the legend) */}

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={85}
                      outerRadius={125}
                      paddingAngle={3}
                    >
                      {donutData.map((slice) => (
                        <Cell key={slice.id} fill={slice.color} />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* CATEGORY LIST */}

              <div className="space-y-4">
                {donutData.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />

                      <span className="truncate text-sm font-medium capitalize text-slate-700">
                        {category.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(category.amount)}
                      </p>

                      <p className="text-xs text-slate-400">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* INCOME VS EXPENSES */}

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Income vs Expenses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Compare your monthly income and spending.
            </p>
          </div>

          <div className="h-87.5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="label" tick={{ fontSize: 12 }} />

                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                />

                <Tooltip formatter={(value) => formatCurrency(Number(value))} />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />

                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Analytics;
