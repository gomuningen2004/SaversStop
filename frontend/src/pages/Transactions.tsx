import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type {
  Account,
  AccountsResponse,
  Category,
  Transaction,
} from '../types';

const API_URL = 'http://127.0.0.1:8000';

const ITEMS_PER_PAGE = 10;

type DateFilter =
  | 'this-month'
  | 'this-year'
  | 'previous-year'
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

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getDateKey(date: string) {
  return date.slice(0, 10);
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

function getTodayDate() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(today.getDate()).padStart(2, '0')}`;
}

function getThisMonthStart() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-01`;
}

function getThisYearStart() {
  const today = new Date();

  return `${today.getFullYear()}-01-01`;
}

function getPreviousYearStart() {
  const today = new Date();

  return `${today.getFullYear() - 1}-01-01`;
}

function getPreviousYearEnd() {
  const today = new Date();

  return `${today.getFullYear() - 1}-12-31`;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6">
      {/* MOBILE PAGINATION */}

      <div className="flex items-center justify-between gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="text-sm font-medium text-slate-500">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      {/* DESKTOP PAGINATION */}

      <div className="hidden items-center justify-center gap-2 sm:flex">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
                  page === currentPage
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [transferCurrentPage, setTransferCurrentPage] = useState(1);

  const [dateFilter, setDateFilter] = useState<DateFilter>('this-year');

  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/transactions`),
      fetch(`${API_URL}/api/accounts`),
      fetch(`${API_URL}/api/categories`),
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
            throw new Error('Failed to load transaction data');
          }

          const transactionsData = (await transactionsResponse.json()) as {
            transactions: Array<{
              id: string;
              transaction_date: string;
              reason: string | null;
              category_id: string | null;
              account_id: string;
              amount: number | string;
              type: 'sent' | 'received';
              transfer_id: string | null;
            }>;
          };

          const accountsData =
            (await accountsResponse.json()) as AccountsResponse;

          const categoriesData = (await categoriesResponse.json()) as {
            categories: Array<{
              id: string;
              name: string;
              active: boolean;
            }>;
          };

          const normalizedTransactions: Transaction[] =
            transactionsData.transactions.map((transaction) => ({
              id: transaction.id,
              transactionDate: transaction.transaction_date,
              reason: transaction.reason,
              categoryId: transaction.category_id ?? '',
              accountId: transaction.account_id,
              amount: Number(transaction.amount),
              type: transaction.type,
              transferId: transaction.transfer_id,
            }));

          const normalizedAccounts: Account[] = accountsData.accounts.map(
            (account) => ({
              id: account.id,
              name: account.name,
              accountTypeId: account.account_type_id,
              currentBalance: Number(account.current_balance),
              active: account.active,
            }),
          );

          const normalizedCategories: Category[] =
            categoriesData.categories.map((category) => ({
              id: category.id,
              name: category.name,
              active: category.active,
            }));

          setTransactions(normalizedTransactions);
          setCategories(normalizedCategories);
          setAccounts(normalizedAccounts);

          setLoading(false);
        },
      )
      .catch((err) => {
        console.error(err);
        setError('Unable to load transaction data.');
        setLoading(false);
      });
  }, []);

  /*
   * CATEGORY LOOKUP
   */

  const categoryMap = useMemo(() => {
    return categories.reduce(
      (map, category) => {
        map[category.id] = category.name;
        return map;
      },
      {} as Record<string, string>,
    );
  }, [categories]);

  /*
   * ACCOUNT LOOKUP
   */

  const accountMap = useMemo(() => {
    return accounts.reduce(
      (map, account) => {
        map[account.id] = account.name;
        return map;
      },
      {} as Record<string, string>,
    );
  }, [accounts]);

  /*
   * CALCULATE ACTIVE DATE RANGE.
   */

  const dateRange = useMemo(() => {
    const today = getTodayDate();

    switch (dateFilter) {
      case 'this-month':
        return {
          start: getThisMonthStart(),
          end: today,
        };

      case 'this-year':
        return {
          start: getThisYearStart(),
          end: today,
        };

      case 'previous-year':
        return {
          start: getPreviousYearStart(),
          end: getPreviousYearEnd(),
        };

      case 'custom':
        return {
          start: customStartDate,
          end: customEndDate,
        };

      case 'all-time':
      default:
        return {
          start: '',
          end: '',
        };
    }
  }, [dateFilter, customStartDate, customEndDate]);

  /*
   * FILTER TRANSACTIONS BY DATE.
   *
   * The transaction date is converted to YYYY-MM-DD
   * before comparison so timezone conversion does not
   * change the displayed day.
   */

  const filteredTransactions = useMemo(() => {
    if (dateFilter === 'all-time') {
      return transactions;
    }

    if (dateFilter === 'custom' && (!dateRange.start || !dateRange.end)) {
      return [];
    }

    if (
      dateFilter === 'custom' &&
      dateRange.start &&
      dateRange.end &&
      dateRange.start > dateRange.end
    ) {
      return [];
    }

    return transactions.filter((transaction) => {
      const transactionDate = getDateKey(transaction.transactionDate);

      return (
        transactionDate >= dateRange.start && transactionDate <= dateRange.end
      );
    });
  }, [transactions, dateFilter, dateRange]);

  /*
   * NORMAL TRANSACTIONS ONLY.
   */

  const regularTransactions = useMemo(() => {
    return filteredTransactions.filter(
      (transaction) => !transaction.transferId,
    );
  }, [filteredTransactions]);

  /*
   * SELF-TRANSFER TRANSACTIONS.
   */

  const transferTransactions = useMemo(() => {
    return filteredTransactions.filter((transaction) => transaction.transferId);
  }, [filteredTransactions]);

  /*
   * GROUP SELF TRANSFERS BY transferId.
   */

  const transferGroups = useMemo(() => {
    return Object.values(
      transferTransactions.reduce(
        (groups, transaction) => {
          const transferId = transaction.transferId;

          if (!transferId) {
            return groups;
          }

          if (!groups[transferId]) {
            groups[transferId] = [];
          }

          groups[transferId].push(transaction);

          return groups;
        },
        {} as Record<string, Transaction[]>,
      ),
    );
  }, [transferTransactions]);

  /*
   * PAGINATION FOR NORMAL TRANSACTIONS.
   */

  const paginatedRegularTransactions = useMemo(() => {
    const sortedTransactions = [...regularTransactions].sort((a, b) =>
      b.transactionDate.localeCompare(a.transactionDate),
    );

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return sortedTransactions.slice(startIndex, endIndex);
  }, [regularTransactions, currentPage]);

  /*
   * GROUP CURRENT PAGE BY DATE.
   */

  const paginatedTransactionsByDate = paginatedRegularTransactions.reduce(
    (groups, transaction) => {
      const date = getDateKey(transaction.transactionDate);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(transaction);

      return groups;
    },
    {} as Record<string, Transaction[]>,
  );

  const paginatedTransactionDates = Object.keys(
    paginatedTransactionsByDate,
  ).sort((a, b) => b.localeCompare(a));

  const transactionTotalPages = Math.ceil(
    regularTransactions.length / ITEMS_PER_PAGE,
  );

  /*
   * SORT SELF TRANSFERS.
   */

  const sortedTransferGroups = useMemo(() => {
    return [...transferGroups].sort((a, b) => {
      const aSent = a.find((transaction) => transaction.type === 'sent');
      const bSent = b.find((transaction) => transaction.type === 'sent');

      if (!aSent || !bSent) {
        return 0;
      }

      return bSent.transactionDate.localeCompare(aSent.transactionDate);
    });
  }, [transferGroups]);

  /*
   * PAGINATION FOR SELF TRANSFERS.
   */

  const paginatedTransferGroups = useMemo(() => {
    const startIndex = (transferCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return sortedTransferGroups.slice(startIndex, endIndex);
  }, [sortedTransferGroups, transferCurrentPage]);

  /*
   * GROUP CURRENT TRANSFER PAGE BY DATE.
   */

  const paginatedTransfersByDate = paginatedTransferGroups.reduce(
    (groups, transfer) => {
      const sent = transfer.find((transaction) => transaction.type === 'sent');

      if (!sent) {
        return groups;
      }

      const date = getDateKey(sent.transactionDate);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(transfer);

      return groups;
    },
    {} as Record<string, Transaction[][]>,
  );

  const paginatedTransferDates = Object.keys(paginatedTransfersByDate).sort(
    (a, b) => b.localeCompare(a),
  );

  const transferTotalPages = Math.ceil(
    sortedTransferGroups.length / ITEMS_PER_PAGE,
  );

  /*
   * RESET PAGINATION WHEN THE DATE FILTER CHANGES.
   */

  useEffect(() => {
    setCurrentPage(1);
    setTransferCurrentPage(1);
  }, [dateFilter, customStartDate, customEndDate]);

  /*
   * KEEP PAGINATION VALID WHEN DATA CHANGES.
   */

  useEffect(() => {
    if (transactionTotalPages > 0 && currentPage > transactionTotalPages) {
      setCurrentPage(transactionTotalPages);
    }
  }, [currentPage, transactionTotalPages]);

  useEffect(() => {
    if (transferTotalPages > 0 && transferCurrentPage > transferTotalPages) {
      setTransferCurrentPage(transferTotalPages);
    }
  }, [transferCurrentPage, transferTotalPages]);

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
      {/* PAGE HEADER */}

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

      {/* DATE FILTER */}

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Date Range</h2>

          <p className="mt-1 text-xs text-slate-500">
            Choose which transactions you want to view.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDateFilter('this-month')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              dateFilter === 'this-month'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            This Month
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('this-year')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              dateFilter === 'this-year'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            This Year
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('previous-year')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              dateFilter === 'previous-year'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Previous Year
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('all-time')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              dateFilter === 'all-time'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Time
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('custom')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              dateFilter === 'custom'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Custom Range
          </button>
        </div>

        {dateFilter === 'custom' && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="start-date"
                className="mb-1.5 block text-xs font-medium text-slate-600"
              >
                From
              </label>

              <input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(event) => setCustomStartDate(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="end-date"
                className="mb-1.5 block text-xs font-medium text-slate-600"
              >
                To
              </label>

              <input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(event) => setCustomEndDate(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              />
            </div>
          </div>
        )}

        {dateFilter === 'custom' &&
          customStartDate &&
          customEndDate &&
          customStartDate > customEndDate && (
            <p className="mt-3 text-xs font-medium text-red-500">
              The start date cannot be after the end date.
            </p>
          )}
      </section>

      {/* TRANSACTIONS */}

      <section className="mb-12">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Transactions</h2>

          <p className="mt-1 text-sm text-slate-500">
            Your income and expenses.
          </p>
        </div>

        {regularTransactions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
            No transactions found for this date range.
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {paginatedTransactionDates.map((date) => (
                <div key={date}>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-700">
                      {formatDate(date)}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {paginatedTransactionsByDate[date].map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300 hover:shadow-sm sm:gap-4 sm:px-4 sm:py-4"
                      >
                        {/* ICON */}

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${
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
                            {transaction.reason || 'Transaction'}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="inline-block max-w-full truncate rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 sm:px-2.5">
                              {formatCategory(
                                categoryMap[transaction.categoryId] ??
                                  'Unknown',
                              )}
                            </span>
                          </div>
                        </div>

                        {/* AMOUNT + ACCOUNT */}

                        <div className="w-auto shrink-0 text-right sm:min-w-[110px]">
                          <p
                            className={`text-sm font-semibold whitespace-nowrap ${
                              transaction.type === 'received'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {transaction.type === 'received' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {accountMap[transaction.accountId] ??
                              'Unknown Account'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={transactionTotalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      {/* SELF TRANSFERS */}

      <section>
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

        {sortedTransferGroups.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
            No self transfers found for this date range.
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {paginatedTransferDates.map((date) => (
                <div key={date}>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-700">
                      {formatDate(date)}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {paginatedTransfersByDate[date].map((transferGroup) => {
                      const sent = transferGroup.find(
                        (transaction) => transaction.type === 'sent',
                      );

                      const received = transferGroup.find(
                        (transaction) => transaction.type === 'received',
                      );

                      if (!sent || !received) {
                        return null;
                      }

                      return (
                        <div
                          key={sent.transferId}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300 hover:shadow-sm sm:gap-4 sm:px-4 sm:py-4"
                        >
                          {/* TRANSFER ICON */}

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 sm:h-11 sm:w-11">
                            <ArrowLeftRight
                              size={20}
                              strokeWidth={2}
                              className="text-blue-600"
                            />
                          </div>

                          {/* ACCOUNT ROUTE */}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="max-w-[110px] truncate text-sm font-medium text-slate-900 sm:max-w-none">
                                {accountMap[sent.accountId] ??
                                  'Unknown Account'}
                              </span>

                              <ArrowLeftRight
                                size={15}
                                strokeWidth={2}
                                className="shrink-0 text-slate-400"
                              />

                              <span className="max-w-[110px] truncate text-sm font-medium text-slate-900 sm:max-w-none">
                                {accountMap[received.accountId] ??
                                  'Unknown Account'}
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
                            <p className="text-sm font-semibold whitespace-nowrap text-slate-900">
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

            <Pagination
              currentPage={transferCurrentPage}
              totalPages={transferTotalPages}
              onPageChange={setTransferCurrentPage}
            />
          </>
        )}
      </section>
    </main>
  );
}

export default Transactions;
