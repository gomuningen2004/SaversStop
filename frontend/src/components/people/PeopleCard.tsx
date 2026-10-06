import { HandCoins, Plus, Receipt } from 'lucide-react';

import type { Person } from '../../types';

type PeopleCardProps = {
  person: Person;
  balance: number;
  saving: boolean;
  formatAmount: (amount: number) => string;
  onPayment: (person: Person) => void;
  onHistory: (person: Person) => void;
  onAddDebt: (person: Person) => void;
};

function PeopleCard({
  person,
  balance,
  saving,
  formatAmount,
  onPayment,
  onHistory,
  onAddDebt,
}: PeopleCardProps) {
  const isSettled = balance === 0;
  const isReceivable = balance > 0;
  const balanceLabel = isSettled
    ? 'Settled'
    : isReceivable
      ? 'You are owed'
      : 'You owe';
  const balanceAmount = isSettled
    ? ''
    : `${isReceivable ? '+' : '-'}${formatAmount(Math.abs(balance))}`;
  const balanceColor = isSettled
    ? 'text-slate-500'
    : isReceivable
      ? 'text-emerald-700'
      : 'text-rose-700';

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
            {person.name.charAt(0).toUpperCase()}
          </span>
          <h3 className="min-w-0 truncate font-semibold text-slate-900">
            {person.name}
          </h3>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isSettled
              ? 'bg-slate-100 text-slate-600'
              : isReceivable
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
          }`}
        >
          {balanceLabel}
        </span>
      </header>

      <div className="mt-4 flex min-h-12 items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium text-slate-500">
          {isSettled ? 'No outstanding balance' : 'Outstanding balance'}
        </p>
        {!isSettled && (
          <p className={`text-lg font-semibold tabular-nums ${balanceColor}`}>
            {balanceAmount}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onPayment(person)}
          disabled={saving || isSettled}
          aria-label={`Record payment for ${person.name}`}
          title={
            isSettled
              ? 'No outstanding balance'
              : `Record payment of ${formatAmount(Math.abs(balance))}`
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HandCoins size={17} aria-hidden="true" />
          <span className="hidden sm:inline">Payment</span>
        </button>

        <button
          type="button"
          onClick={() => onHistory(person)}
          disabled={saving}
          aria-label={`View history for ${person.name}`}
          title="View debt history"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Receipt size={17} aria-hidden="true" />
          <span className="hidden sm:inline">History</span>
        </button>

        <button
          type="button"
          onClick={() => onAddDebt(person)}
          disabled={saving}
          aria-label={`Add debt for ${person.name}`}
          title="Add new debt"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={17} aria-hidden="true" />
          <span className="hidden sm:inline">Add Debt</span>
        </button>
      </div>
    </article>
  );
}

export default PeopleCard;
