import { useEffect, useState } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import type {
  Category,
  CategoriesResponse,
  Transaction,
  TransactionsResponse,
} from '../types';

type ModalMode = 'add' | 'edit';

function formatCategoryName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
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

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );

  const [categoryName, setCategoryName] = useState('');

  const [categoryError, setCategoryError] = useState('');

  /*
   * Load categories and transactions.
   *
   * Transactions are needed to determine whether
   * a category can safely be deleted.
   */
  useEffect(() => {
    Promise.all([
      fetch('/data/categories.json'),
      fetch('/data/transactions.json'),
    ])
      .then(async ([categoriesResponse, transactionsResponse]) => {
        if (!categoriesResponse.ok || !transactionsResponse.ok) {
          throw new Error('Failed to load data');
        }

        const categoriesData =
          (await categoriesResponse.json()) as CategoriesResponse;

        const transactionsData =
          (await transactionsResponse.json()) as TransactionsResponse;

        setCategories(categoriesData.categories);
        setTransactions(transactionsData.transactions);

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load categories.');
        setLoading(false);
      });
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
    setShowCategoryModal(false);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryError('');
  }

  /*
   * Add or edit category.
   */
  function handleCategorySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCategoryError('');

    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      setCategoryError('Please enter a category name.');

      return;
    }

    /*
     * Prevent duplicate category names.
     */
    const alreadyExists = categories.some(
      (category) =>
        category.id !== editingCategoryId &&
        category.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (alreadyExists) {
      setCategoryError('This category already exists.');

      return;
    }

    /*
     * ADD
     */
    if (modalMode === 'add') {
      const newCategory: Category = {
        id:
          categories.length > 0
            ? Math.max(...categories.map((category) => category.id)) + 1
            : 1,

        name: trimmedName,
      };

      setCategories((current) => [...current, newCategory]);

      closeCategoryModal();

      return;
    }

    /*
     * EDIT
     */
    if (editingCategoryId !== null) {
      setCategories((current) =>
        current.map((category) =>
          category.id === editingCategoryId
            ? {
                ...category,
                name: trimmedName,
              }
            : category,
        ),
      );

      closeCategoryModal();
    }
  }

  /*
   * Delete category.
   */
  function handleDeleteCategory(category: Category) {
    /*
     * Check if the category is being used.
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

    setCategories((current) =>
      current.filter((item) => item.id !== category.id),
    );
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

        {categories.length === 0 ? (
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
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  {modalMode === 'add' ? 'Add Category' : 'Save Changes'}
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
