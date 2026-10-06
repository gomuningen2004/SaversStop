import { Link as RouterLink } from 'react-router-dom';

import CategoryFilters from '../components/categories/CategoryFilters';
import CategorySpendingBreakdown from '../components/categories/CategorySpendingBreakdown';
import { useCategoriesPage } from '../hooks/useCategoriesPage';

function Categories() {
  const {
    accounts, categories, categorySpending, customFrom, customTo, error,
    formatCategoryName, formatCurrency, loading, period, selectedAccount,
    selectedCategory, setCustomFrom, setCustomTo, setPeriod, setSelectedAccount,
    setSelectedCategory, totalSpent,
  } = useCategoriesPage();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-slate-500">Loading categories...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8 pb-24 lg:pb-8">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 pb-24 lg:pb-8">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>

          <p className="mt-1 text-sm text-slate-500">
            See where your money is being spent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RouterLink
            to="/categories/manage"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Manage Categories
          </RouterLink>
        </div>
      </div>

      {/* ==================================================
          FILTERS
      ================================================== */}

      <CategoryFilters
        period={period}
        selectedAccount={selectedAccount}
        selectedCategory={selectedCategory}
        customFrom={customFrom}
        customTo={customTo}
        accounts={accounts}
        categories={categories}
        onPeriodChange={setPeriod}
        onAccountChange={setSelectedAccount}
        onCategoryChange={setSelectedCategory}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        formatCategoryName={formatCategoryName}
      />

      {/* ==================================================
          TOTAL SPENT
      ================================================== */}

      <section className="mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Spent</p>

          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(totalSpent)}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Based on the selected filters
          </p>
        </div>
      </section>

      {/* ==================================================
          CATEGORY BREAKDOWN
      ================================================== */}

      <CategorySpendingBreakdown
        categories={categorySpending}
        totalSpent={totalSpent}
        formatCurrency={formatCurrency}
        formatCategoryName={formatCategoryName}
      />
    </main>
  );
}

export default Categories;
