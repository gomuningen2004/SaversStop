import { Plus } from 'lucide-react';

import type { Account } from '../../types';

type GoalAddFormProps = {
  accounts: Account[];
  name: string;
  accountId: string;
  targetAmount: string;
  monthlyContribution: string;
  targetDate: string;
  error: string;
  saving: boolean;
  onNameChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  onTargetAmountChange: (value: string) => void;
  onMonthlyContributionChange: (value: string) => void;
  onTargetDateChange: (value: string) => void;
  onSubmit: () => void;
};

function GoalAddForm({
  accounts,
  name,
  accountId,
  targetAmount,
  monthlyContribution,
  targetDate,
  error,
  saving,
  onNameChange,
  onAccountChange,
  onTargetAmountChange,
  onMonthlyContributionChange,
  onTargetDateChange,
  onSubmit,
}: GoalAddFormProps) {
  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Add Goal</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create a new savings goal without leaving this page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label
            htmlFor="new-goal-name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Goal Name
          </label>
          <input
            id="new-goal-name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. New Laptop"
            disabled={saving}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="new-goal-account"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Account
          </label>
          <select
            id="new-goal-account"
            value={accountId}
            onChange={(event) => onAccountChange(event.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="new-target-amount"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Target Amount
          </label>
          <input
            id="new-target-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={targetAmount}
            onChange={(event) => onTargetAmountChange(event.target.value)}
            placeholder="80000"
            disabled={saving}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="new-monthly-contribution"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Monthly Contribution
          </label>
          <input
            id="new-monthly-contribution"
            type="number"
            min="0.01"
            step="0.01"
            value={monthlyContribution}
            onChange={(event) => onMonthlyContributionChange(event.target.value)}
            placeholder="10000"
            disabled={saving}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="new-target-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Target Date
          </label>
          <input
            id="new-target-date"
            type="date"
            value={targetDate}
            onChange={(event) => onTargetDateChange(event.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={16} />
          {saving ? 'Creating...' : 'Create Goal'}
        </button>
      </div>
    </div>
  );
}

export default GoalAddForm;
