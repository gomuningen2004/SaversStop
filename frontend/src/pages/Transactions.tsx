import { useMemo, useState, type ReactNode } from 'react';

import AddTransactionModal from '../components/AddTransactionModal';
import DateRangeFilter from '../components/Daterangefilter';
import Pagination from '../components/Pagination';
import { TransactionRow, TransferRow } from '../components/Transactionrows';
import { useTransactionData } from '../hooks/useTransactionData';
import {
  buildTransfers,
  formatDate,
  getDateKey,
  getDateRange,
  groupByDate,
  paginate,
  type DateFilter,
} from '../utils/transactions';

const ITEMS_PER_PAGE = 10;

/* Wider page so the two lists can sit side by side on large screens. */
const pageClass = 'mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 lg:py-8 lg:pb-8';

const emptyStateClass =
  'rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500';

/** Renders items grouped under date headings (newest date first). */
function DateGroups<T>({
  items,
  getDate,
  renderItem,
}: {
  items: T[];
  getDate: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}) {
  const groups = groupByDate(items, getDate);
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {dates.map((date) => (
        <div key={date}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {formatDate(date)}
          </h3>

          <div className="space-y-2">{groups[date].map(renderItem)}</div>
        </div>
      ))}
    </div>
  );
}

function Transactions() {
  const { transactions, categories, accounts, loading, error, reload } =
    useTransactionData();

  const [showAddModal, setShowAddModal] = useState(false);

  const [dateFilter, setDateFilter] = useState<DateFilter>('this-year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [transactionPage, setTransactionPage] = useState(1);
  const [transferPage, setTransferPage] = useState(1);

  /* Any change to the filter sends both lists back to page 1. */
  const resetPages = () => {
    setTransactionPage(1);
    setTransferPage(1);
  };

  const handleFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
    resetPages();
  };

  const handleStartDateChange = (date: string) => {
    setCustomStartDate(date);
    resetPages();
  };

  const handleEndDateChange = (date: string) => {
    setCustomEndDate(date);
    resetPages();
  };

  /* ---------- Lookups ---------- */

  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const accountNames = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  const getAccountName = (id: string) =>
    accountNames.get(id) ?? 'Unknown Account';

  /* ---------- Filtering ---------- */

  const filteredTransactions = useMemo(() => {
    if (dateFilter === 'all-time') return transactions;

    const { start, end } = getDateRange(
      dateFilter,
      customStartDate,
      customEndDate,
    );

    // Incomplete or inverted custom range -> nothing to show.
    if (!start || !end || start > end) return [];

    return transactions.filter((t) => {
      const date = getDateKey(t.transactionDate);
      return date >= start && date <= end;
    });
  }, [transactions, dateFilter, customStartDate, customEndDate]);

  const regularTransactions = useMemo(
    () =>
      filteredTransactions
        .filter((t) => !t.transferId)
        .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [filteredTransactions],
  );

  const transfers = useMemo(
    () => buildTransfers(filteredTransactions),
    [filteredTransactions],
  );

  /* ---------- Pagination ---------- */

  const transactionPager = paginate(
    regularTransactions,
    transactionPage,
    ITEMS_PER_PAGE,
  );
  const transferPager = paginate(transfers, transferPage, ITEMS_PER_PAGE);

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <main className={pageClass}>
        <p className="text-sm text-slate-500">Loading transactions...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={pageClass}>
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className={pageClass}>
      {/* HEADER */}
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-8 sm:items-center">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your income, expenses and transfers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 sm:px-4 sm:py-2.5"
        >
          <span className="sm:hidden">+ Add</span>
          <span className="hidden sm:inline">+ Add Transaction</span>
        </button>
      </div>

      <DateRangeFilter
        value={dateFilter}
        startDate={customStartDate}
        endDate={customEndDate}
        onChange={handleFilterChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />

      {/*
        Stacked on mobile/tablet, side by side on large screens
        (transactions 3/5, self transfers 2/5).
      */}
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-8">
        {/* TRANSACTIONS */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Transactions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your income and expenses.
            </p>
          </div>

          {regularTransactions.length === 0 ? (
            <div className={emptyStateClass}>
              No transactions found for this date range.
            </div>
          ) : (
            <>
              <DateGroups
                items={transactionPager.items}
                getDate={(t) => t.transactionDate}
                renderItem={(t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    categoryName={categoryNames.get(t.categoryId) ?? 'Unknown'}
                    accountName={getAccountName(t.accountId)}
                  />
                )}
              />

              <Pagination
                currentPage={transactionPager.page}
                totalPages={transactionPager.totalPages}
                onPageChange={setTransactionPage}
              />
            </>
          )}
        </section>

        {/* SELF TRANSFERS */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Self Transfers
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Money moved between your own accounts.
            </p>
          </div>

          {transfers.length === 0 ? (
            <div className={emptyStateClass}>
              No self transfers found for this date range.
            </div>
          ) : (
            <>
              <DateGroups
                items={transferPager.items}
                getDate={(t) => t.sent.transactionDate}
                renderItem={(transfer) => (
                  <TransferRow
                    key={transfer.id}
                    transfer={transfer}
                    getAccountName={getAccountName}
                  />
                )}
              />

              <Pagination
                currentPage={transferPager.page}
                totalPages={transferPager.totalPages}
                onPageChange={setTransferPage}
              />
            </>
          )}
        </section>
      </div>

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={reload}
      />
    </main>
  );
}

export default Transactions;
