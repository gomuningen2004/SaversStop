import { X } from 'lucide-react';

import type { Goal } from '../../types';

type GoalContributionModalProps = {
  goal: Goal;
  amount: string;
  saving: boolean;
  formatAmount: (amount: number) => string;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function GoalContributionModal({
  goal,
  amount,
  saving,
  formatAmount,
  onAmountChange,
  onClose,
  onSubmit,
}: GoalContributionModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add Contribution
            </h2>
            <p className="mt-1 text-sm text-slate-500">{goal.name}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Contribution amount
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            placeholder="10000"
            autoFocus
            disabled={saving}
          />
          <p className="mt-2 text-xs text-slate-500">
            Current saved amount: {formatAmount(goal.savedAmount)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Remaining:{' '}
            {formatAmount(
              Math.max(goal.targetAmount - goal.savedAmount, 0),
            )}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Add Contribution'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalContributionModal;
