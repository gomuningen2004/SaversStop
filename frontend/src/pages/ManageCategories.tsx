import { useEffect, useState } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Category, Transaction } from '../types';

const API_URL = 'http://127.0.0.1:8000';

type ModalMode = 'add' | 'edit';

type RawCategory = {
  id: string;
  name: string;
  active: boolean;
};

type RawCategoriesResponse = {
  categories: RawCategory[];
};

type RawTransaction = {
  id: string;
  transaction_date: string;
  reason?: string | null;
  category_id: string | null;
  account_id: string;
  amount: number | string;
  type: 'sent' | 'received';
  transfer_id?: string | null;
};

type RawTransactionsResponse = {
  transactions: RawTransaction[];
};

function formatCategoryName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getApiError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}

function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Category modal
   */
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>('add');

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

  const [categoryName, setCategoryName] = useState('');

  const [categoryError, setCategoryError] = useState('');

  const [savingCategory, setSavingCategory] = useState(false);

  /*
   * Load categories and transactions from FastAPI.
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesResponse, transactionsResponse] = await Promise.all([
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/transactions`),
        ]);

        if (!categoriesResponse.ok || !transactionsResponse.ok) {
          throw new Error('Failed to load category data.');
        }

        const categoriesData =
          (await categoriesResponse.json()) as RawCategoriesResponse;

        const transactionsData =
          (await transactionsResponse.json()) as RawTransactionsResponse;

        /*
         * Normalize categories.
         */
        const normalizedCategories: Category[] = (
          categoriesData.categories ?? []
        ).map((category) => ({
          id: category.id,
          name: category.name,
          active: category.active,
        }));

        /*
         * Normalize transactions.
         *
         * Transactions are only needed here to determine
         * whether a category is currently being used.
         */
        const normalizedTransactions: Transaction[] = (
          transactionsData.transactions ?? []
        ).map((transaction) => ({
          id: transaction.id,
          transactionDate: transaction.transaction_date,
          reason: transaction.reason,
          categoryId: transaction.category_id ?? '',
          accountId: transaction.account_id,
          amount: Number(transaction.amount),
          type: transaction.type,
          transferId: transaction.transfer_id ?? null,
        }));

        setCategories(normalizedCategories);
        setTransactions(normalizedTransactions);
      } catch (err) {
        console.error(err);
        setError(`Unable to load categories. ${getApiError(err)}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * Open Add Category modal.
   */
  function openAddCategoryModal() {
    setModalMode('add');
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryError('');
    setShowCategoryModal(true);
  }

  /*
   * Open Edit Category modal.
   */
  function openEditCategoryModal(category: Category) {
    setModalMode('edit');
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryError('');
    setShowCategoryModal(true);
  }

  /*
   * Close modal.
   */
  function closeCategoryModal() {
    if (savingCategory) {
      return;
    }

    setShowCategoryModal(false);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryError('');
  }

  /*
   * Add or edit category.
   */
  async function handleCategorySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCategoryError('');

    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      setCategoryError('Please enter a category name.');
      return;
    }

    setSavingCategory(true);

    try {
      /*
       * ADD CATEGORY
       */
      if (modalMode === 'add') {
        const response = await fetch(`${API_URL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: trimmedName,
            active: true,
          }),
        });

        if (!response.ok) {
          let message = 'Failed to create category.';

          try {
            const errorData = await response.json();

            if (typeof errorData.detail === 'string') {
              message = errorData.detail;
            }
          } catch {
            // Keep default error message.
          }

          throw new Error(message);
        }

        const newCategory = (await response.json()) as RawCategory;

        const normalizedCategory: Category = {
          id: newCategory.id,
          name: newCategory.name,
          active: newCategory.active,
        };

        setCategories((current) => [...current, normalizedCategory]);

        closeCategoryModal();

        return;
      }

      /*
       * EDIT CATEGORY
       */
      if (editingCategoryId !== null) {
        const response = await fetch(
          `${API_URL}/api/categories/${editingCategoryId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: trimmedName,
            }),
          },
        );

        if (!response.ok) {
          let message = 'Failed to update category.';

          try {
            const errorData = await response.json();

            if (typeof errorData.detail === 'string') {
              message = errorData.detail;
            }
          } catch {
            // Keep default error message.
          }

          throw new Error(message);
        }

        const updatedCategory = (await response.json()) as RawCategory;

        const normalizedCategory: Category = {
          id: updatedCategory.id,
          name: updatedCategory.name,
          active: updatedCategory.active,
        };

        setCategories((current) =>
          current.map((category) =>
            category.id === normalizedCategory.id
              ? normalizedCategory
              : category,
          ),
        );

        closeCategoryModal();
      }
    } catch (err) {
      console.error(err);
      setCategoryError(getApiError(err));
    } finally {
      setSavingCategory(false);
    }
  }

  /*
   * Delete category.
   */
  async function handleDeleteCategory(category: Category) {
    /*
     * Check if the category is being used
     * by any existing transaction.
     */
    const isUsed = transactions.some(
      (transaction) => transaction.categoryId === category.id,
    );

    if (isUsed) {
      window.alert(
        `"${formatCategoryName(
          category.name,
        )}" cannot be deleted because it is being used by existing transactions.`,
      );

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${formatCategoryName(category.name)}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let message = 'Failed to delete category.';

        try {
          const errorData = await response.json();

          if (typeof errorData.detail === 'string') {
            message = errorData.detail;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(message);
      }

      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
    } catch (err) {
      console.error(err);

      window.alert(`Unable to delete category.\n\n${getApiError(err)}`);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-slate-500">Loading categories...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  /*
   * Only display active categories.
   */
  const activeCategories = categories.filter((category) => category.active);

  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 lg:pb-8">
        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2">
              <Link
                to="/categories"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeft size={16} />
                Categories
              </Link>
            </div>

            <h1 className="text-2xl font-semibold text-slate-900">
              Manage Categories
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Add, edit, or remove your categories.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddCategoryModal}
            className="flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>

        {/* ==================================================
            CATEGORY CARDS
        ================================================== */}

        {activeCategories.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No categories available.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add your first category to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {activeCategories.map((category) => {
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
                        <p className="mt-1 text-[11px] text-slate-400">
                          In use
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() => openEditCategoryModal(category)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label={`Edit ${category.name}`}
                        title="Edit category"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${category.name}`}
                        title={
                          isUsed ? 'Category is being used' : 'Delete category'
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ==================================================
          ADD / EDIT MODAL
      ================================================== */}

      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onMouseDown={closeCategoryModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {modalMode === 'add' ? 'Add Category' : 'Edit Category'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {modalMode === 'add'
                    ? 'Create a category for your transactions.'
                    : 'Rename this category.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCategoryModal}
                disabled={savingCategory}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleCategorySubmit}>
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
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="e.g. Groceries"
                  autoFocus
                  disabled={savingCategory}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* ERROR */}

              {categoryError && (
                <p className="mt-3 text-sm text-red-500">{categoryError}</p>
              )}

              {/* BUTTONS */}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  disabled={savingCategory}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingCategory}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingCategory
                    ? 'Saving...'
                    : modalMode === 'add'
                      ? 'Add Category'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ManageCategories;
