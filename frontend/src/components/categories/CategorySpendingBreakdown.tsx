import type { Category } from '../../types';

type CategorySpending = Category & { amount: number };

type CategorySpendingBreakdownProps = {
  categories: CategorySpending[];
  totalSpent: number;
  formatCurrency: (amount: number) => string;
  formatCategoryName: (name: string) => string;
};

function CategorySpendingBreakdown({
  categories,
  totalSpent,
  formatCurrency,
  formatCategoryName,
}: CategorySpendingBreakdownProps) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Spending by Category</h2>
        <p className="mt-1 text-sm text-slate-500">
          Categories with spending in the selected period.
        </p>
      </div>
      {categories.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">No spending found.</p>
          <p className="mt-1 text-sm text-slate-500">
            Try changing your filters or date range.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const percentage = totalSpent > 0 ? (category.amount / totalSpent) * 100 : 0;
            return (
              <div
                key={category.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <p className="truncate text-sm font-semibold text-slate-900">
                  {formatCategoryName(category.name)}
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {formatCurrency(category.amount)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {percentage.toFixed(1)}% of spending
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CategorySpendingBreakdown;
