import { Pencil, Trash2 } from 'lucide-react';

import type { Category, Transaction } from '../../types';

type ManageCategoryListProps = {
  categories: Category[];
  transactions: Transaction[];
  formatCategoryName: (name: string) => string;
  emptyMessage: string;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

function ManageCategoryList({
  categories,
  transactions,
  formatCategoryName,
  emptyMessage,
  onEdit,
  onDelete,
}: ManageCategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-700">{emptyMessage}</p>
        <p className="mt-1 text-sm text-slate-500">
          Add your first category to get started.
        </p>
      </div>
    );
  }

  const usageCounts = new Map<string, number>();
  transactions.forEach((transaction) => {
    if (!transaction.categoryId) return;
    usageCounts.set(
      transaction.categoryId,
      (usageCounts.get(transaction.categoryId) ?? 0) + 1,
    );
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => {
        const usageCount = usageCounts.get(category.id) ?? 0;
        const isUsed = usageCount > 0;

        return (
          <div
            key={category.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {formatCategoryName(category.name)}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    isUsed ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {isUsed
                    ? `${usageCount} ${usageCount === 1 ? 'transaction' : 'transactions'}`
                    : 'Unused'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onEdit(category)}
                  className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                  aria-label={`Edit ${category.name}`}
                  title="Edit category"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(category)}
                  className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                  aria-label={`Delete ${category.name}`}
                  title={isUsed ? 'Category is being used' : 'Delete category'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ManageCategoryList;
