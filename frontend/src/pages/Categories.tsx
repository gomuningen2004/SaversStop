import { Link as RouterLink } from 'react-router-dom';
import { Settings2 } from 'lucide-react';

import CategoryFilters from '../components/categories/CategoryFilters';
import CategorySpendingBreakdown from '../components/categories/CategorySpendingBreakdown';
import { useCategoriesPage } from '../hooks/useCategoriesPage';

const pageClass =
  'mx-auto w-full max-w-7xl px-4 py-5 pb-24 sm:px-6 lg:py-8 lg:pb-8';

function Categories() {
  const {
    accounts,
    categories,
    categoryFlows,
    customFrom,
    customTo,
    error,
    formatCategoryName,
    formatCurrency,
    loading,
    period,
    selectedAccount,
    selectedCategory,
    setCustomFrom,
    setCustomTo,
    setPeriod,
    setSelectedAccount,
    setSelectedCategory,
    totalMoneyIn,
    totalMoneyOut,
  } = useCategoriesPage();

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
    <main className={pageClass}>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-700">
            Money flows
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Categories
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            See income and expenses by category and account.
          </p>
        </div>
        <RouterLink
          to="/categories/manage"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
        >
          <Settings2 size={16} aria-hidden="true" />
          Manage Categories
        </RouterLink>
      </div>

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

      <CategorySpendingBreakdown
        categories={categoryFlows}
        totalMoneyIn={totalMoneyIn}
        totalMoneyOut={totalMoneyOut}
        formatCurrency={formatCurrency}
        formatCategoryName={formatCategoryName}
      />
    </main>
  );
}

export default Categories;
