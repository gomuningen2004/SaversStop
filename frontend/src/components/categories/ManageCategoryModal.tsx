import type { FormEventHandler } from 'react';
import { X } from 'lucide-react';

export type CategoryModalMode = 'add' | 'edit';

type ManageCategoryModalProps = {
  mode: CategoryModalMode;
  categoryName: string;
  categoryError: string;
  saving: boolean;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function ManageCategoryModal({
  mode,
  categoryName,
  categoryError,
  saving,
  onNameChange,
  onClose,
  onSubmit,
}: ManageCategoryModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === 'add' ? 'Add Category' : 'Edit Category'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'add'
                ? 'Create a category for your transactions.'
                : 'Rename this category.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Category Name
            </label>
            <input
              id="category-name"
              type="text"
              value={categoryName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="e.g. Groceries"
              autoFocus
              disabled={saving}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
          {categoryError && (
            <p className="mt-3 text-sm text-red-500">{categoryError}</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : mode === 'add'
                  ? 'Add Category'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManageCategoryModal;
