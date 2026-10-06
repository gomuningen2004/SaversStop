import type { CategoryFlow } from '../../hooks/useCategoriesPage';

type CategorySpendingBreakdownProps = {
  categories: CategoryFlow[];
  totalMoneyIn: number;
  totalMoneyOut: number;
  formatCurrency: (amount: number) => string;
  formatCategoryName: (name: string) => string;
};

function CategorySpendingBreakdown({
  categories,
  totalMoneyIn,
  totalMoneyOut,
  formatCurrency,
  formatCategoryName,
}: CategorySpendingBreakdownProps) {
  return (
    <div className="space-y-7">
      <section className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
        <div className="bg-white p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-500">Money in</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700 tabular-nums">
            {formatCurrency(totalMoneyIn)}
          </p>
        </div>
        <div className="bg-white p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-500">Money out</p>
          <p className="mt-2 text-2xl font-semibold text-rose-700 tabular-nums">
            {formatCurrency(totalMoneyOut)}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              In and out by category
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Each category is split by account.
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-500">
            {categories.length}{' '}
            {categories.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No categorized income or expenses found.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your filters or date range.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.id}
                className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <header className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    {formatCategoryName(category.name)}
                  </h3>
                  <div className="flex gap-4 sm:gap-6">
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase text-slate-500">
                        In
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-emerald-700 tabular-nums">
                        {formatCurrency(category.moneyIn)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase text-slate-500">
                        Out
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-rose-700 tabular-nums">
                        {formatCurrency(category.moneyOut)}
                      </p>
                    </div>
                  </div>
                </header>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(4.5rem,auto)] gap-2 pb-2 text-[11px] font-medium uppercase text-slate-400 sm:text-xs">
                    <span>Account</span>
                    <span className="text-right">In</span>
                    <span className="text-right">Out</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {category.accounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(4.5rem,auto)] items-center gap-2 py-2.5 text-xs sm:text-sm"
                      >
                        <span className="min-w-0 truncate font-medium text-slate-700">
                          {account.accountName}
                        </span>
                        <span className="whitespace-nowrap text-right font-medium text-emerald-700 tabular-nums">
                          {formatCurrency(account.moneyIn)}
                        </span>
                        <span className="whitespace-nowrap text-right font-medium text-rose-700 tabular-nums">
                          {formatCurrency(account.moneyOut)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CategorySpendingBreakdown;
