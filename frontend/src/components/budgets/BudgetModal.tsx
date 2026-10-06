import { XCircle } from 'lucide-react';

import type { Budget, Category } from '../../types';

type BudgetModalProps = {
  editingBudget: Budget | null;
  selectedMonth: string;
  categories: Category[];
  availableCategories: Category[];
  categoryId: string;
  amount: string;
  formatMonth: (month: string) => string;
  onCategoryChange: (categoryId: string) => void;
  onAmountChange: (amount: string) => void;
  onClose: () => void;
  onSave: () => void;
};

function BudgetModal({
  editingBudget,
  selectedMonth,
  categories,
  availableCategories,
  categoryId,
  amount,
  formatMonth,
  onCategoryChange,
  onAmountChange,
  onClose,
  onSave,
}: BudgetModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {editingBudget ? 'Edit Budget' : 'Add Budget'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set your spending limit for {formatMonth(selectedMonth)}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <XCircle size={18} />
          </button>
        </div>
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="">Select category</option>
            {editingBudget &&
              !availableCategories.some(
                (category) => category.id === editingBudget.categoryId,
              ) && (
                <option value={editingBudget.categoryId}>
                  {categories.find(
                    (category) => category.id === editingBudget.categoryId,
                  )?.name ?? 'Current category'}
                </option>
              )}
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Monthly budget
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="100"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="8000"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 pl-8 text-sm outline-none focus:border-slate-400"
              autoFocus
            />
          </div>
        </div>
        <div className="mt-6 rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            How it works
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            SaversStop will automatically compare this budget with your actual
            transactions for the selected month.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            {editingBudget ? 'Save Changes' : 'Add Budget'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BudgetModal;
