import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';

import {
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
  Bar,
  BarChart,
  CartesianGrid,
} from 'recharts';

import type {
  Category,
  CategoriesResponse,
  Transaction,
  TransactionsResponse,
} from '../types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

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
};

type MonthlyData = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
};

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonth(month: string) {
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

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    months.push(`${year}-${month}`);
  }

  return months;
}

function Analytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  /*
   * ---------------------------------------------------------
   * LOAD TRANSACTIONS + CATEGORIES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const API_URL = 'http://127.0.0.1:8000';

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

        /*
         * -----------------------------------------------------
         * TRANSACTIONS
         * -----------------------------------------------------
         */

        const transactionsData = (await transactionsResponse.json()) as {
          transactions: Array<{
            id: string;
            transaction_date: string;
            reason?: string | null;
            category_id: string | null;
            account_id: string;
            amount: number | string;
            type: 'sent' | 'received';
            transfer_id?: string | null;
          }>;
        };

        /*
         * -----------------------------------------------------
         * CATEGORIES
         * -----------------------------------------------------
         */

        const categoriesData =
          (await categoriesResponse.json()) as CategoriesResponse;

        /*
         * -----------------------------------------------------
         * NORMALIZE TRANSACTIONS
         *
         * Backend:
         * transaction_date
         * category_id
         * account_id
         * transfer_id
         *
         * Frontend:
         * transactionDate
         * categoryId
         * accountId
         * transferId
         * -----------------------------------------------------
         */

        const normalizedTransactions: Transaction[] =
          transactionsData.transactions.map((transaction) => ({
            id: transaction.id,
            transactionDate: transaction.transaction_date,
            reason: transaction.reason ?? null,
            categoryId: transaction.category_id ?? '',
            accountId: transaction.account_id,
            amount: Number(transaction.amount),
            type: transaction.type,
            transferId: transaction.transfer_id ?? null,
          }));

        /*
         * -----------------------------------------------------
         * NORMALIZE CATEGORIES
         * -----------------------------------------------------
         */

        const normalizedCategories: Category[] = categoriesData.categories.map(
          (category) => ({
            id: category.id,
            name: category.name,
            active: category.active,
          }),
        );

        setTransactions(normalizedTransactions);
        setCategories(normalizedCategories);

        console.log('Analytics transactions:', normalizedTransactions);
        console.log('Analytics categories:', normalizedCategories);
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * ---------------------------------------------------------
   * EXCLUDE SELF TRANSFERS
   *
   * Transfers are still present in transaction history,
   * but must not count as income or expenses.
   * ---------------------------------------------------------
   */

  const financialTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) => transaction.transferId === null,
    );
  }, [transactions]);

  /*
   * ---------------------------------------------------------
   * SUMMARY CALCULATIONS
   * ---------------------------------------------------------
   */

  const totalIncome = useMemo(() => {
    return financialTransactions
      .filter((transaction) => transaction.type === 'received')
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [financialTransactions]);

  const totalExpenses = useMemo(() => {
    return financialTransactions
      .filter((transaction) => transaction.type === 'sent')
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [financialTransactions]);

  const netSavings = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const savingsRate = useMemo(() => {
    if (totalIncome === 0) {
      return 0;
    }

    return (netSavings / totalIncome) * 100;
  }, [totalIncome, netSavings]);

  /*
   * ---------------------------------------------------------
   * CATEGORY LOOKUP
   * ---------------------------------------------------------
   */

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  /*
   * ---------------------------------------------------------
   * SPENDING BY CATEGORY
   * ---------------------------------------------------------
   */

  const categorySpending = useMemo<CategorySpending[]>(() => {
    const spending = new Map<string, number>();

    financialTransactions
      .filter((transaction) => transaction.type === 'sent')
      .forEach((transaction) => {
        const current = spending.get(transaction.categoryId) ?? 0;

        spending.set(transaction.categoryId, current + transaction.amount);
      });

    const total = Array.from(spending.values()).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    return Array.from(spending.entries())
      .map(([categoryId, amount]) => ({
        id: categoryId,
        name: categoryMap.get(categoryId) ?? 'Unknown',
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [financialTransactions, categoryMap]);

  /*
   * ---------------------------------------------------------
   * LAST 12 MONTHS
   * ---------------------------------------------------------
   */

  const recentMonths = useMemo(() => getRecentMonths(12), []);

  /*
   * ---------------------------------------------------------
   * MONTHLY ANALYTICS
   * ---------------------------------------------------------
   */

  const monthlyData = useMemo<MonthlyData[]>(() => {
    const monthly = new Map<
      string,
      {
        income: number;
        expenses: number;
      }
    >();

    recentMonths.forEach((month) => {
      monthly.set(month, {
        income: 0,
        expenses: 0,
      });
    });

    financialTransactions.forEach((transaction) => {
      const month = getMonthKey(transaction.transactionDate);

      if (!monthly.has(month)) {
        return;
      }

      const current = monthly.get(month)!;

      if (transaction.type === 'received') {
        current.income += transaction.amount;
      } else {
        current.expenses += transaction.amount;
      }
    });

    return recentMonths.map((month) => {
      const data = monthly.get(month)!;

      return {
        month,
        label: formatMonth(month),
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      };
    });
  }, [financialTransactions, recentMonths]);

  /*
   * ---------------------------------------------------------
   * AVERAGE MONTHLY SAVINGS
   * ---------------------------------------------------------
   */

  const averageMonthlySavings = useMemo(() => {
    if (monthlyData.length === 0) {
      return 0;
    }

    return (
      monthlyData.reduce((total, month) => total + month.savings, 0) /
      monthlyData.length
    );
  }, [monthlyData]);

  /*
   * ---------------------------------------------------------
   * PREVIOUS MONTH COMPARISON
   * ---------------------------------------------------------
   */

  const currentMonthExpenses =
    monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].expenses : 0;

  const previousMonthExpenses =
    monthlyData.length > 1 ? monthlyData[monthlyData.length - 2].expenses : 0;

  const expenseChange = useMemo(() => {
    if (previousMonthExpenses === 0) {
      return null;
    }

    return (
      ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) *
      100
    );
  }, [currentMonthExpenses, previousMonthExpenses]);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-slate-500">Loading analytics...</p>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

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
          {/* INCOME */}

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

          {/* EXPENSES */}

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

          {/* SAVINGS */}

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
              {formatCurrency(Math.abs(netSavings))}
            </p>
          </div>

          {/* SAVINGS RATE */}

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

        {/* SAVINGS SUMMARY */}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Savings Summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              How much you're keeping after expenses.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Average Monthly Savings</p>

              <p
                className={`mt-1 text-xl font-semibold ${
                  averageMonthlySavings >= 0 ? 'text-slate-900' : 'text-red-600'
                }`}
              >
                {formatCurrency(Math.abs(averageMonthlySavings))}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Total Income</p>

              <p className="mt-1 text-xl font-semibold text-green-600">
                {formatCurrency(totalIncome)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Total Expenses</p>

              <p className="mt-1 text-xl font-semibold text-red-600">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </section>

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
              {/* DONUT */}

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={85}
                      outerRadius={125}
                      paddingAngle={3}
                    >
                      {categorySpending.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* CATEGORY LIST */}

              <div className="space-y-4">
                {categorySpending.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            chartColors[index % chartColors.length],
                        }}
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

        {/* MONTHLY SPENDING */}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Monthly Spending
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your expenses over the last 12 months.
            </p>
          </div>

          <div className="h-87.5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="label" tick={{ fontSize: 12 }} />

                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                />

                <Tooltip formatter={(value) => formatCurrency(Number(value))} />

                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {expenseChange !== null && (
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">
                {expenseChange < 0 ? (
                  <>
                    You spent{' '}
                    <span className="font-semibold text-green-600">
                      {Math.abs(expenseChange).toFixed(1)}% less
                    </span>{' '}
                    this month compared with last month.
                  </>
                ) : expenseChange > 0 ? (
                  <>
                    You spent{' '}
                    <span className="font-semibold text-red-600">
                      {expenseChange.toFixed(1)}% more
                    </span>{' '}
                    this month compared with last month.
                  </>
                ) : (
                  <>Your spending is the same as last month.</>
                )}
              </p>
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
