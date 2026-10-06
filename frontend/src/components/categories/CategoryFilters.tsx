import type { Account, Category } from '../../types';

export type CategoryPeriod =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'last-year'
  | 'all-time'
  | 'custom';

type CategoryFiltersProps = {
  period: CategoryPeriod;
  selectedAccount: string;
  selectedCategory: string;
  customFrom: string;
  customTo: string;
  accounts: Account[];
  categories: Category[];
  onPeriodChange: (period: CategoryPeriod) => void;
  onAccountChange: (accountId: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onCustomFromChange: (date: string) => void;
  onCustomToChange: (date: string) => void;
  formatCategoryName: (name: string) => string;
};

function CategoryFilters({
  period,
  selectedAccount,
  selectedCategory,
  customFrom,
  customTo,
  accounts,
  categories,
  onPeriodChange,
  onAccountChange,
  onCategoryChange,
  onCustomFromChange,
  onCustomToChange,
  formatCategoryName,
}: CategoryFiltersProps) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-8 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
          <p className="mt-1 text-xs text-slate-500">
            Choose a period, account, or category to view activity.
          </p>
        </div>
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        <div className="min-w-0">
          <label
            htmlFor="period"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Period
          </label>
          <select
            id="period"
            value={period}
            onChange={(event) =>
              onPeriodChange(event.target.value as CategoryPeriod)
            }
            className="block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
            <option value="last-year">Last Year</option>
            <option value="all-time">All Time</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        <div className="min-w-0">
          <label
            htmlFor="account"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Account
          </label>
          <select
            id="account"
            value={selectedAccount}
            onChange={(event) => onAccountChange(event.target.value)}
            className="block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="all">All Accounts</option>
            {accounts
              .filter((account) => account.active)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
        </div>
        <div className="min-w-0">
          <label
            htmlFor="category"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="all">All Categories</option>
            {categories
              .filter((category) => category.active)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {formatCategoryName(category.name)}
                </option>
              ))}
          </select>
        </div>
      </div>
      {period === 'custom' && (
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="custom-from"
              className="mb-2 block text-xs font-medium text-slate-600"
            >
              From
            </label>
            <input
              id="custom-from"
              type="date"
              value={customFrom}
              onChange={(event) => onCustomFromChange(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
          <div>
            <label
              htmlFor="custom-to"
              className="mb-2 block text-xs font-medium text-slate-600"
            >
              To
            </label>
            <input
              id="custom-to"
              type="date"
              value={customTo}
              onChange={(event) => onCustomToChange(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default CategoryFilters;
