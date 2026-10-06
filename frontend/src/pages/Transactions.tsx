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
    selectedAccount,
    selectedCategory,
    hasActiveFilters,
    handleFilterChange,
    handleStartDateChange,
    handleEndDateChange,
    handleAccountChange,
    handleCategoryChange,
    resetFilters,
    categoryNames,
    getAccountName,
    accounts,
    categories,
    regularTransactions,
    transfers,
    transactionPager,
    transferPager,
    setTransactionPage,
    setTransferPage,
  } = useTransactionsPage();
  const hasCategoryFilter = selectedCategory !== 'all';

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
        selectedAccount={selectedAccount}
        selectedCategory={selectedCategory}
        hasActiveFilters={hasActiveFilters}
        accounts={accounts}
        categories={categories}
        onChange={handleFilterChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onAccountChange={handleAccountChange}
        onCategoryChange={handleCategoryChange}
        onReset={resetFilters}
      />

      <div
        className={`grid gap-10 lg:items-start lg:gap-8 ${
          hasCategoryFilter ? 'grid-cols-1' : 'lg:grid-cols-2'
        }`}
      >
        {/* TRANSACTIONS */}
        <section>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Transactions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your income and expenses.
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {regularTransactions.length}{' '}
              {regularTransactions.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {regularTransactions.length === 0 ? (
            <div className={emptyStateClass}>
              No transactions found for the selected filters.
            </div>
          ) : (
            <>
              <DateGroups
                items={transactionPager.items}
                getDate={(t) => t.transactionDate}
                itemsClassName={
                  hasCategoryFilter
                    ? 'grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4'
                    : undefined
                }
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
        {!hasCategoryFilter && (
          <section>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Self Transfers
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Money moved between your own accounts.
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {transfers.length}{' '}
                {transfers.length === 1 ? 'transfer' : 'transfers'}
              </span>
            </div>

            {transfers.length === 0 ? (
              <div className={emptyStateClass}>
                No self transfers found for this date range and account.
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
        )}
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
