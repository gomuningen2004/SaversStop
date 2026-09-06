import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';

import type {
  Category,
  CategoriesResponse,
  Transaction,
  TransactionsResponse,
} from '../types';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return parsedDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Load transactions and categories.
   */
  useEffect(() => {
    Promise.all([
      fetch('/data/transactions.json'),
      fetch('/data/categories.json'),
    ])
      .then(async ([transactionsResponse, categoriesResponse]) => {
        if (!transactionsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to load transaction data');
        }

        const transactionsData =
          (await transactionsResponse.json()) as TransactionsResponse;

        const categoriesData =
          (await categoriesResponse.json()) as CategoriesResponse;

        setTransactions(transactionsData.transactions);
        setCategories(categoriesData.categories);

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load transaction data.');
        setLoading(false);
      });
  }, []);

  /*
   * Create a category lookup.
   *
   * Example:
   *
   * {
   *   1: "food",
   *   2: "utilities",
   *   4: "shopping",
   *   5: "salary"
   * }
   *
   * This lets us convert categoryId -> category name.
   */
  const categoryMap = useMemo(() => {
    return categories.reduce(
      (map, category) => {
        map[category.id] = category.name;
        return map;
      },
      {} as Record<number, string>,
    );
  }, [categories]);

  /*
   * ALL transactions appear here.
   *
   * This includes self-transfer records.
   */
  const regularTransactions = transactions;

  /*
   * Get only transactions that belong to a self transfer.
   */
  const transferTransactions = transactions.filter(
    (transaction) => transaction.transferId !== undefined,
  );

  /*
   * Group self-transfer records by transferId.
   */
  const transferGroups = Object.values(
    transferTransactions.reduce(
      (groups, transaction) => {
        const transferId = transaction.transferId;

        if (transferId === undefined) {
          return groups;
        }

        if (!groups[transferId]) {
          groups[transferId] = [];
        }

        groups[transferId].push(transaction);

        return groups;
      },
      {} as Record<number, Transaction[]>,
    ),
  );

  /*
   * Group regular transactions by date.
   */
  const transactionsByDate = regularTransactions.reduce(
    (groups, transaction) => {
      if (!groups[transaction.date]) {
        groups[transaction.date] = [];
      }

      groups[transaction.date].push(transaction);

      return groups;
    },
    {} as Record<string, Transaction[]>,
  );

  /*
   * Sort dates newest -> oldest.
   */
  const transactionDates = Object.keys(transactionsByDate).sort((a, b) =>
    b.localeCompare(a),
  );

  /*
   * Group self transfers by date.
   */
  const transfersByDate = transferGroups.reduce(
    (groups, transfer) => {
      const sent = transfer.find((transaction) => transaction.type === 'sent');

      if (!sent) {
        return groups;
      }

      if (!groups[sent.date]) {
        groups[sent.date] = [];
      }

      groups[sent.date].push(transfer);

      return groups;
    },
    {} as Record<string, Transaction[][]>,
  );

  /*
   * Sort transfer dates newest -> oldest.
   */
  const transferDates = Object.keys(transfersByDate).sort((a, b) =>
    b.localeCompare(a),
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-slate-500">Loading transactions...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8 pb-24 lg:pb-8">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Transactions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your income, expenses and transfers.
          </p>
        </div>

        <Link
          to="/add-transaction"
          className="w-fit rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          + Add Transaction
        </Link>
      </div>

      {/* =====================================================
          REGULAR TRANSACTIONS
      ===================================================== */}

      <section className="mb-12">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Transactions</h2>

          <p className="mt-1 text-sm text-slate-500">
            Your income and expenses.
          </p>
        </div>

        {transactionDates.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
            No transactions found.
          </div>
        ) : (
          <div className="space-y-8">
            {transactionDates.map((date) => (
              <div key={date}>
                {/* DATE BLOCK */}

                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {formatDate(date)}
                  </h3>
                </div>

                {/* TRANSACTIONS */}

                <div className="space-y-2">
                  {transactionsByDate[date].map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:shadow-sm"
                    >
                      {/* ICON */}

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          transaction.type === 'received'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}
                      >
                        {transaction.type === 'received' ? (
                          <ArrowDownLeft
                            size={20}
                            strokeWidth={2}
                            className="text-green-600"
                          />
                        ) : (
                          <ArrowUpRight
                            size={20}
                            strokeWidth={2}
                            className="text-red-600"
                          />
                        )}
                      </div>

                      {/* REASON + CATEGORY */}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {transaction.reason || 'Self Transfer'}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {transaction.transferId !== undefined
                              ? 'Self Transfer'
                              : formatCategory(
                                  categoryMap[transaction.categoryId] ??
                                    'Unknown',
                                )}
                          </span>
                        </div>
                      </div>

                      {/* AMOUNT + BANK */}

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-sm font-semibold ${
                            transaction.type === 'received'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'received' ? '+' : '-'}

                          {formatCurrency(transaction.amount)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {transaction.account}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          SELF TRANSFERS
      ===================================================== */}

      <section>
        {/* SECTION HEADER */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Self Transfers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Money moved between your own accounts.
            </p>
          </div>
        </div>

        {transferDates.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
            No self transfers found.
          </div>
        ) : (
          <div className="space-y-8">
            {transferDates.map((date) => (
              <div key={date}>
                {/* DATE BLOCK */}

                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {formatDate(date)}
                  </h3>
                </div>

                {/* TRANSFERS ON THIS DATE */}

                <div className="space-y-2">
                  {transfersByDate[date].map((transferGroup) => {
                    const sent = transferGroup.find(
                      (transaction) => transaction.type === 'sent',
                    );

                    const received = transferGroup.find(
                      (transaction) => transaction.type === 'received',
                    );

                    /*
                     * If the transfer is incomplete,
                     * don't render it.
                     */
                    if (!sent || !received) {
                      return null;
                    }

                    return (
                      <div
                        key={sent.transferId}
                        className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:shadow-sm"
                      >
                        {/* TRANSFER ICON */}

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <ArrowLeftRight
                            size={20}
                            strokeWidth={2}
                            className="text-blue-600"
                          />
                        </div>

                        {/* ACCOUNT ROUTE */}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {sent.account}
                            </span>

                            <ArrowLeftRight
                              size={15}
                              strokeWidth={2}
                              className="text-slate-400"
                            />

                            <span className="text-sm font-medium text-slate-900">
                              {received.account}
                            </span>
                          </div>

                          <div className="mt-1.5">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Self Transfer
                            </span>
                          </div>
                        </div>

                        {/* AMOUNT */}

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(sent.amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Transactions;
