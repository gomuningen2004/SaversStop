import AddTransactionModal from '../components/transactions/AddTransactionModal';
import DateGroups from '../components/transactions/DateGroups';
import DateRangeFilter from '../components/transactions/DateRangeFilter';
import Pagination from '../components/transactions/Pagination';
import {
  TransactionRow,
  TransferRow,
} from '../components/transactions/TransactionRows';
import { useTransactionsPage } from '../hooks/useTransactionsPage';

/* Wider page so the two lists can sit side by side on large screens. */
const pageClass = 'mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 lg:py-8 lg:pb-8';

const emptyStateClass =
  'rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500';

function Transactions() {
  const {
    loading,
    error,
    reload,
    showAddModal,
    openAddModal,
    closeAddModal,
    dateFilter,
    customStartDate,
    customEndDate,
    handleFilterChange,
    handleStartDateChange,
    handleEndDateChange,
    categoryNames,
    getAccountName,
    regularTransactions,
    transfers,
    transactionPager,
    transferPager,
    setTransactionPage,
    setTransferPage,
  } = useTransactionsPage();

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
          onClick={openAddModal}
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
        onClose={closeAddModal}
        onSuccess={reload}
      />
    </main>
  );
}

export default Transactions;
