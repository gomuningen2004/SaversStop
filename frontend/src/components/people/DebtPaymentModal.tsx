import { HandCoins, Plus } from 'lucide-react';

import type { Person } from '../../types';

export type DebtType = 'owed_to_me' | 'i_owe';
export type ModalMode = 'debt' | 'payment';

type DebtPaymentModalProps = {
  person: Person;
  mode: ModalMode;
  debtType: DebtType;
  debtAmount: string;
  debtReason: string;
  paymentAmount: string;
  balance: number;
  balanceLabel: string;
  saving: boolean;
  formatAmount: (amount: number) => string;
  onDebtTypeChange: (type: DebtType) => void;
  onDebtAmountChange: (amount: string) => void;
  onDebtReasonChange: (reason: string) => void;
  onPaymentAmountChange: (amount: string) => void;
  onClose: () => void;
  onAddDebt: () => void;
  onRecordPayment: () => void;
};

function DebtPaymentModal({
  person,
  mode,
  debtType,
  debtAmount,
  debtReason,
  paymentAmount,
  balance,
  balanceLabel,
  saving,
  formatAmount,
  onDebtTypeChange,
  onDebtAmountChange,
  onDebtReasonChange,
  onPaymentAmountChange,
  onClose,
  onAddDebt,
  onRecordPayment,
}: DebtPaymentModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {person.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'payment' ? 'Record a payment.' : 'Add a new IOU.'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-lg bg-slate-50 p-4">
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

        {mode === 'debt' && (
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Plus size={17} className="text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Add new IOU
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => onDebtTypeChange('owed_to_me')}
                disabled={saving}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                  debtType === 'owed_to_me'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                They owe me
              </button>
              <button
                onClick={() => onDebtTypeChange('i_owe')}
                disabled={saving}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                  debtType === 'i_owe'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                I owe them
              </button>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={debtAmount}
                onChange={(event) => onDebtAmountChange(event.target.value)}
                placeholder="2500"
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Reason
              </label>
              <input
                value={debtReason}
                onChange={(event) => onDebtReasonChange(event.target.value)}
                placeholder="Dinner, borrowed money, etc."
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </div>

            <button
              onClick={onAddDebt}
              disabled={saving}
              className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Add IOU'}
            </button>
          </div>
        )}

        {mode === 'payment' && (
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <HandCoins size={17} className="text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Record payment
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {balance > 0
                ? `${person.name} is paying you.`
                : `You are paying ${person.name}.`}
            </p>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Payment amount
              </label>
              <input
                type="number"
                min="0"
                max={Math.abs(balance)}
                step="0.01"
                value={paymentAmount}
                onChange={(event) => onPaymentAmountChange(event.target.value)}
                placeholder={Math.abs(balance).toString()}
                disabled={saving}
                autoFocus
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Maximum payment: {formatAmount(Math.abs(balance))}
            </p>
            <button
              onClick={onRecordPayment}
              disabled={saving}
              className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          disabled={saving}
          className="mt-6 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default DebtPaymentModal;
