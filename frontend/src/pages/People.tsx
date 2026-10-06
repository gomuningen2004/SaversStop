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

const pageClass =
  'min-h-[calc(100vh-64px)] w-full px-4 py-5 pb-24 sm:px-6 lg:py-8 lg:pb-8';

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
      <main className={pageClass}>
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-slate-500">Loading people...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={pageClass}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">
              People &amp; IOUs
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
              People
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Keep track of money you owe and money others owe you.
            </p>
          </div>

          <button
            type="button"
            onClick={openPersonModal}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus size={17} aria-hidden="true" />
            Add Person
          </button>
        </div>

        <section className="mb-8 grid gap-3 md:grid-cols-[1.15fr_1fr_1fr]">
          <div className="rounded-xl bg-[#173b35] p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-100">
              <WalletCards size={18} aria-hidden="true" />
              Net position
            </div>
            <p
              className={`mt-3 wrap-break-word text-2xl font-semibold tabular-nums sm:text-3xl ${
                summary.netPosition < 0 ? 'text-rose-200' : 'text-white'
              }`}
            >
              {formatAmount(summary.netPosition)}
            </p>
            <p className="mt-1 text-xs text-emerald-100/75">
              Receivable minus payable
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <ArrowDownLeft
                size={18}
                className="text-emerald-700"
                aria-hidden="true"
              />
              Total receivable
            </div>
            <p className="mt-3 text-2xl font-semibold text-emerald-700 tabular-nums">
              {formatAmount(summary.totalReceivable)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Money others owe you</p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <ArrowUpRight
                size={18}
                className="text-rose-700"
                aria-hidden="true"
              />
              Total payable
            </div>
            <p className="mt-3 text-2xl font-semibold text-rose-700 tabular-nums">
              {formatAmount(summary.totalPayable)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Money you owe others</p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">People</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage outstanding balances and interactions.
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-slate-500">
              {activePeople.length}{' '}
              {activePeople.length === 1 ? 'person' : 'people'}
            </span>
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
                type="button"
                onClick={openPersonModal}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus size={17} aria-hidden="true" />
                Add Person
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

      {showPersonModal && (
        <AddPersonModal
          name={personName}
          saving={saving}
          onNameChange={setPersonName}
          onClose={closePersonModal}
          onSubmit={addPerson}
        />
      )}

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
