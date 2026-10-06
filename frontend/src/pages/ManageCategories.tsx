import { useState } from 'react';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

import ManageCategoryList from '../components/categories/ManageCategoryList';
import ManageCategoryModal from '../components/categories/ManageCategoryModal';
import { useManageCategoriesPage } from '../hooks/useManageCategoriesPage';

const pageClass =
  'mx-auto w-full max-w-6xl px-4 py-5 pb-24 sm:px-6 lg:py-8 lg:pb-8';

function ManageCategories() {
  const {
    activeCategories,
    categoryError,
    categoryName,
    closeCategoryModal,
    error,
    formatCategoryName,
    handleCategorySubmit,
    handleDeleteCategory,
    loading,
    modalMode,
    openAddCategoryModal,
    openEditCategoryModal,
    savingCategory,
    setCategoryName,
    showCategoryModal,
    transactions,
  } = useManageCategoriesPage();
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredCategories = activeCategories.filter((category) =>
    formatCategoryName(category.name).toLowerCase().includes(normalizedSearch),
  );
  const inUseCategoryCount = activeCategories.filter((category) =>
    transactions.some((transaction) => transaction.categoryId === category.id),
  ).length;

  if (loading) {
    return (
      <main className={pageClass}>
        <p className="text-sm text-slate-500">Loading categories...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={pageClass}>
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <>
      <main className={pageClass}>
        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2">
              <Link
                to="/categories"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeft size={16} />
                Categories
              </Link>
            </div>

            <p className="text-xs font-semibold uppercase text-emerald-700">
              Category management
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Manage Categories
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Add, edit, or remove your categories.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddCategoryModal}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>

        {/* ==================================================
            CATEGORY CARDS
        ================================================== */}

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Active categories
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
              {activeCategories.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">In use</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700 tabular-nums">
              {inUseCategoryCount}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Unused</p>
            <p className="mt-2 text-2xl font-semibold text-slate-700 tabular-nums">
              {activeCategories.length - inUseCategoryCount}
            </p>
          </div>
        </section>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {filteredCategories.length} of {activeCategories.length}{' '}
            categories
          </p>
          <label className="relative block w-full sm:max-w-xs">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search categories"
              aria-label="Search categories"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </label>
        </div>

        <ManageCategoryList
          categories={filteredCategories}
          transactions={transactions}
          formatCategoryName={formatCategoryName}
          emptyMessage={
            normalizedSearch
              ? 'No categories match your search.'
              : 'No categories available.'
          }
          onEdit={openEditCategoryModal}
          onDelete={handleDeleteCategory}
        />
      </main>

      {/* ==================================================
          ADD / EDIT MODAL
      ================================================== */}

      {showCategoryModal && (
        <ManageCategoryModal
          mode={modalMode}
          categoryName={categoryName}
          categoryError={categoryError}
          saving={savingCategory}
          onNameChange={setCategoryName}
          onClose={closeCategoryModal}
          onSubmit={handleCategorySubmit}
        />
      )}
    </>
  );
}

export default ManageCategories;
