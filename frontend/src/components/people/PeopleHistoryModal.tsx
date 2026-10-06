import { ArrowDownLeft, ArrowUpRight, Clock, Receipt } from 'lucide-react';

import type { DebtInteraction, Person } from '../../types';

type PeopleHistoryModalProps = {
  person: Person;
  balance: number;
  balanceLabel: string;
  interactions: DebtInteraction[];
  formatAmount: (amount: number) => string;
  formatDate: (date: string) => string;
  onClose: () => void;
};

function PeopleHistoryModal({
  person,
  balance,
  balanceLabel,
  interactions,
  formatAmount,
  formatDate,
  onClose,
}: PeopleHistoryModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {person.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">IOU history</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              ×
            </button>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Current balance</p>
            <p
              className={`mt-1 text-xl font-semibold ${
                balance > 0
                  ? 'text-emerald-600'
                  : balance < 0
                    ? 'text-red-600'
                    : 'text-slate-900'
              }`}
            >
              {balanceLabel}
            </p>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-6">
          {interactions.length === 0 ? (
            <div className="py-10 text-center">
              <Clock size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                No interactions yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {interactions.map((interaction) => {
                const increasesBalance =
                  interaction.type === 'owed_to_me' ||
                  interaction.type === 'payment_sent';
                const isPayment =
                  interaction.type === 'payment_received' ||
                  interaction.type === 'payment_sent';

                return (
                  <div
                    key={interaction.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          isPayment
                            ? 'bg-slate-100'
                            : increasesBalance
                              ? 'bg-emerald-50'
                              : 'bg-red-50'
                        }`}
                      >
                        {isPayment ? (
                          <Receipt size={17} className="text-slate-600" />
                        ) : increasesBalance ? (
                          <ArrowDownLeft
                            size={17}
                            className="text-emerald-600"
                          />
                        ) : (
                          <ArrowUpRight
                            size={17}
                            className="text-red-600"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {interaction.reason || 'No reason provided'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(interaction.interactionDate)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold ${
                        increasesBalance
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {increasesBalance ? '+' : '-'}
                      {formatAmount(interaction.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PeopleHistoryModal;
