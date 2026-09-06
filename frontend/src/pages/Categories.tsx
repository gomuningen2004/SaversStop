import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import type {
  Account,
  AccountsResponse,
  Category,
  CategoriesResponse,
  Transaction,
  TransactionsResponse,
} from '../types';

type Period =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'last-year'
  | 'all-time'
  | 'custom';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCategoryName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

function Categories() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [period, setPeriod] = useState<Period>('this-month');

  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  /*
   * Load transactions, accounts and categories.
   */
  useEffect(() => {
    Promise.all([
      fetch('/data/transactions.json'),
      fetch('/data/accounts.json'),
      fetch('/data/categories.json'),
    ])
      .then(
        async ([
          transactionsResponse,
          accountsResponse,
          categoriesResponse,
        ]) => {
          if (
            !transactionsResponse.ok ||
            !accountsResponse.ok ||
            !categoriesResponse.ok
          ) {
            throw new Error('Failed to load data');
          }

          const transactionsData =
            (await transactionsResponse.json()) as TransactionsResponse;

          const accountsData =
            (await accountsResponse.json()) as AccountsResponse;

          const categoriesData =
            (await categoriesResponse.json()) as CategoriesResponse;

          setTransactions(transactionsData.transactions);
          setAccounts(accountsData.accounts);
          setCategories(categoriesData.categories);

          setLoading(false);
        },
      )
      .catch((err) => {
        console.error(err);
        setError('Unable to load category data.');
        setLoading(false);
      });
  }, []);

  /*
   * Calculate date range.
   */
  const dateRange = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (period === 'all-time') {
      return {
        from: '',
        to: '',
      };
    }

    if (period === 'custom') {
      return {
        from: customFrom,
        to: customTo,
      };
    }

    if (period === 'today') {
      const date = getDateString(today);

      return {
        from: date,
        to: date,
      };
    }

    if (period === 'this-week') {
      const day = today.getDay();

      /*
       * Monday is the first day of the week.
       */
      const difference = day === 0 ? 6 : day - 1;

      const from = new Date(today);

      from.setDate(today.getDate() - difference);

      return {
        from: getDateString(from),
        to: getDateString(today),
      };
    }

    if (period === 'this-month') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);

      return {
        from: getDateString(from),
        to: getDateString(today),
      };
    }

    if (period === 'last-month') {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      const to = new Date(today.getFullYear(), today.getMonth(), 0);

      return {
        from: getDateString(from),
        to: getDateString(to),
      };
    }

    if (period === 'this-year') {
      const from = new Date(today.getFullYear(), 0, 1);

      return {
        from: getDateString(from),
        to: getDateString(today),
      };
    }

    if (period === 'last-year') {
      const from = new Date(today.getFullYear() - 1, 0, 1);

      const to = new Date(today.getFullYear() - 1, 11, 31);

      return {
        from: getDateString(from),
        to: getDateString(to),
      };
    }

    return {
      from: '',
      to: '',
    };
  }, [period, customFrom, customTo]);

  /*
   * Only count actual spending.
   *
   * Received transactions are not spending.
   * Self transfers are excluded.
   */
  const spendingTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (transaction.type !== 'sent') {
        return false;
      }

      if (transaction.transferId !== undefined) {
        return false;
      }

      if (
        selectedAccount !== 'all' &&
        transaction.account !== selectedAccount
      ) {
        return false;
      }

      if (
        selectedCategory !== 'all' &&
        transaction.categoryId !== Number(selectedCategory)
      ) {
        return false;
      }

      if (dateRange.from && transaction.date < dateRange.from) {
        return false;
      }

      if (dateRange.to && transaction.date > dateRange.to) {
        return false;
      }

      return true;
    });
  }, [transactions, selectedAccount, selectedCategory, dateRange]);

  /*
   * Group spending by category.
   */
  const categorySpending = useMemo(() => {
    const totals: Record<number, number> = {};

    spendingTransactions.forEach((transaction) => {
      if (!totals[transaction.categoryId]) {
        totals[transaction.categoryId] = 0;
      }

      totals[transaction.categoryId] += transaction.amount;
    });

    return categories
      .map((category) => ({
        ...category,
        amount: totals[category.id] ?? 0,
      }))
      .filter((category) => category.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [spendingTransactions, categories]);

  /*
   * Total spending.
   */
  const totalSpent = useMemo(() => {
    return spendingTransactions.reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );
  }, [spendingTransactions]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-slate-500">Loading categories...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 pb-24 lg:pb-8">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>

          <p className="mt-1 text-sm text-slate-500">
            See where your money is being spent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RouterLink
            to="/categories/manage"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Manage Categories
          </RouterLink>
        </div>
      </div>

      {/* ==================================================
          FILTERS
      ================================================== */}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Filters</h2>

          <p className="mt-1 text-xs text-slate-500">
            Adjust the period and accounts to analyze your spending.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* PERIOD */}

          <div>
            <label
              htmlFor="period"
              className="mb-2 block text-xs font-medium text-slate-600"
            >
              Period
            </label>

            <select
              id="period"
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="last-year">Last Year</option>
              <option value="all-time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* ACCOUNT */}

          <div>
            <label
              htmlFor="account"
              className="mb-2 block text-xs font-medium text-slate-600"
            >
              Account
            </label>

            <select
              id="account"
              value={selectedAccount}
              onChange={(event) => setSelectedAccount(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="all">All Accounts</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORY */}

          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-xs font-medium text-slate-600"
            >
              Category
            </label>

            <select
              id="category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {formatCategoryName(category.name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CUSTOM RANGE */}

        {period === 'custom' && (
          <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="custom-from"
                className="mb-2 block text-xs font-medium text-slate-600"
              >
                From
              </label>

              <input
                id="custom-from"
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="custom-to"
                className="mb-2 block text-xs font-medium text-slate-600"
              >
                To
              </label>

              <input
                id="custom-to"
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>
        )}
      </section>

      {/* ==================================================
          TOTAL SPENT
      ================================================== */}

      <section className="mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Spent</p>

          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(totalSpent)}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Based on the selected filters
          </p>
        </div>
      </section>

      {/* ==================================================
          CATEGORY BREAKDOWN
      ================================================== */}

      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Spending by Category
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Categories with spending in the selected period.
          </p>
        </div>

        {categorySpending.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No spending found.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your filters or date range.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categorySpending.map((category) => {
              const percentage =
                totalSpent > 0 ? (category.amount / totalSpent) * 100 : 0;

              return (
                <div
                  key={category.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {formatCategoryName(category.name)}
                  </p>

                  <p className="mt-3 text-lg font-semibold text-slate-900">
                    {formatCurrency(category.amount)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {percentage.toFixed(1)}% of spending
                  </p>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Categories;
