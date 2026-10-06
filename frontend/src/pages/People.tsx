import {
  ArrowDownLeft,
  ArrowUpRight,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react';

import PeopleCard from '../components/people/PeopleCard';
import AddPersonModal from '../components/people/AddPersonModal';
import DebtPaymentModal from '../components/people/DebtPaymentModal';
import PeopleHistoryModal from '../components/people/PeopleHistoryModal';

import usePeoplePage from '../hooks/usePeoplePage';

function People() {
  const {
    formatAmount,
    formatDate,
    loading,
    saving,
    showPersonModal,
    showDebtModal,
    showHistoryModal,
    modalMode,
    selectedPerson,
    personName,
    setPersonName,
    debtType,
    setDebtType,
    debtAmount,
    setDebtAmount,
    debtReason,
    setDebtReason,
    paymentAmount,
    setPaymentAmount,
    activePeople,
    sortedBalances,
    summary,
    openDebtModal,
    openPaymentModal,
    closeDebtModal,
    openPersonModal,
    closePersonModal,
    addPerson,
    addDebt,
    recordPayment,
    openHistory,
    closeHistory,
    selectedPersonInteractions,
    selectedPersonBalance,
    selectedBalanceLabel,
  } = usePeoplePage();

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-500">Loading people...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">People</h1>

            <p className="mt-1 text-sm text-slate-500">
              Keep track of money you owe and money others owe you.
            </p>
          </div>

          <button
            onClick={openPersonModal}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus size={17} />
            Add Person
          </button>
        </div>

        {/* Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ArrowDownLeft size={18} />
              Total Receivable
            </div>

            <p className="mt-3 text-2xl font-semibold text-emerald-600">
              {formatAmount(summary.totalReceivable)}
            </p>

            <p className="mt-1 text-xs text-slate-500">Money others owe you</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ArrowUpRight size={18} />
              Total Payable
            </div>

            <p className="mt-3 text-2xl font-semibold text-red-600">
              {formatAmount(summary.totalPayable)}
            </p>

            <p className="mt-1 text-xs text-slate-500">Money you owe others</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <WalletCards size={18} />
              Net Position
            </div>

            <p
              className={`mt-3 text-2xl font-semibold ${
                summary.netPosition > 0
                  ? 'text-emerald-600'
                  : summary.netPosition < 0
                    ? 'text-red-600'
                    : 'text-slate-900'
              }`}
            >
              {formatAmount(summary.netPosition)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Receivable minus payable
            </p>
          </div>
        </div>

        {/* People */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">People</h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage outstanding balances and interactions.
            </p>
          </div>

          {activePeople.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <Users size={40} className="mx-auto text-slate-400" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No people yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Add someone whenever you lend money, borrow money, or need to
                keep track of an IOU.
              </p>

              <button
                onClick={openPersonModal}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus size={17} />
                Add Person
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sortedBalances.map(({ person, balance }) => (
                <PeopleCard
                  key={person.id}
                  person={person}
                  balance={balance}
                  saving={saving}
                  formatAmount={formatAmount}
                  onPayment={openPaymentModal}
                  onHistory={openHistory}
                  onAddDebt={openDebtModal}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Person Modal */}
      {showPersonModal && (
        <AddPersonModal
          name={personName}
          saving={saving}
          onNameChange={setPersonName}
          onClose={closePersonModal}
          onSubmit={addPerson}
        />
      )}

      {/* Debt / Payment Modal */}
      {showDebtModal && selectedPerson && (
        <DebtPaymentModal
          person={selectedPerson}
          mode={modalMode}
          debtType={debtType}
          debtAmount={debtAmount}
          debtReason={debtReason}
          paymentAmount={paymentAmount}
          balance={selectedPersonBalance}
          balanceLabel={selectedBalanceLabel}
          saving={saving}
          formatAmount={formatAmount}
          onDebtTypeChange={setDebtType}
          onDebtAmountChange={setDebtAmount}
          onDebtReasonChange={setDebtReason}
          onPaymentAmountChange={setPaymentAmount}
          onClose={closeDebtModal}
          onAddDebt={addDebt}
          onRecordPayment={recordPayment}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && selectedPerson && (
        <PeopleHistoryModal
          person={selectedPerson}
          balance={selectedPersonBalance}
          balanceLabel={selectedBalanceLabel}
          interactions={selectedPersonInteractions}
          formatAmount={formatAmount}
          formatDate={formatDate}
          onClose={closeHistory}
        />
      )}
    </main>
  );
}

export default People;
