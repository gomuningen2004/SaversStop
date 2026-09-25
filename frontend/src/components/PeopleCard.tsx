import { HandCoins, Plus, Receipt } from 'lucide-react';

import type { Person } from '../types';

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
    : `${isReceivable ? '+' : '-'}${formatAmount(Math.abs(balance))}`;

  const balanceColor = isSettled
    ? 'text-slate-500'
    : isReceivable
      ? 'text-emerald-600'
      : 'text-red-600';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {/* Person header */}
      <div className="flex items-center justify-between gap-4">
        {/* Person */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
            {person.name.charAt(0).toUpperCase()}
          </div>

          <h3 className="min-w-0 truncate font-medium text-slate-900">
            {person.name}
          </h3>
        </div>

        {/* Balance */}
        <span className={`shrink-0 text-sm font-semibold ${balanceColor}`}>
          {balanceLabel}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {/* Payment */}
        <button
          onClick={() => onPayment(person)}
          disabled={saving || isSettled}
          title={
            isSettled
              ? 'No outstanding balance'
              : `Record payment of ${formatAmount(Math.abs(balance))}`
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HandCoins size={17} />

          <span className="hidden sm:inline">Payment</span>
        </button>

        {/* History */}
        <button
          onClick={() => onHistory(person)}
          disabled={saving}
          title="View debt history"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Receipt size={17} />

          <span className="hidden sm:inline">History</span>
        </button>

        {/* Add Debt */}
        <button
          onClick={() => onAddDebt(person)}
          disabled={saving}
          title="Add new debt"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={17} />

          <span className="hidden sm:inline">Add Debt</span>
        </button>
      </div>
    </div>
  );
}

export default PeopleCard;
