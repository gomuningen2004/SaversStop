import { Pencil, Trash2 } from 'lucide-react';

import type { Category, Transaction } from '../../types';

type ManageCategoryListProps = {
  categories: Category[];
  transactions: Transaction[];
  formatCategoryName: (name: string) => string;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

function ManageCategoryList({
  categories,
  transactions,
  formatCategoryName,
  onEdit,
  onDelete,
}: ManageCategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-700">
          No categories available.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Add your first category to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => {
        const isUsed = transactions.some(
          (transaction) => transaction.categoryId === category.id,
        );

        return (
          <div
            key={category.id}
            className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {formatCategoryName(category.name)}
                </p>
                {isUsed && (
                  <p className="mt-1 text-[11px] text-slate-400">In use</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onEdit(category)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={`Edit ${category.name}`}
                  title="Edit category"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(category)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
