import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import ManageCategoryList from '../components/categories/ManageCategoryList';
import ManageCategoryModal from '../components/categories/ManageCategoryModal';
import { useManageCategoriesPage } from '../hooks/useManageCategoriesPage';

function ManageCategories() {
  const {
    activeCategories, categoryError, categoryName, closeCategoryModal, error,
    formatCategoryName, handleCategorySubmit, handleDeleteCategory, loading,
    modalMode, openAddCategoryModal, openEditCategoryModal, savingCategory,
    setCategoryName, showCategoryModal, transactions,
  } = useManageCategoriesPage();

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

        <ManageCategoryList
          categories={activeCategories}
          transactions={transactions}
          formatCategoryName={formatCategoryName}
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
