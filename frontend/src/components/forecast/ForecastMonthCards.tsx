import { TrendingDown, TrendingUp } from 'lucide-react';

import type { CurrencyFormatter, ForecastMonth } from './types';

type ForecastMonthCardsProps = {
  months: ForecastMonth[];
  formatCurrency: CurrencyFormatter;
  formatCompactCurrency: CurrencyFormatter;
};

function ForecastMonthCards({
  months,
  formatCurrency,
  formatCompactCurrency,
}: ForecastMonthCardsProps) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Next 3 months</h2>

        <p className="text-sm text-slate-500">
          Estimated balance based on your current financial patterns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {months.map((month, index) => {
          const positive = month.net_change >= 0;

          return (
            <div
              key={month.month}
              className={`rounded-2xl border bg-white p-6 ${
                index === 0
                  ? 'border-indigo-200 ring-1 ring-indigo-100'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {index === 0
                      ? 'This month'
                      : index === 1
                        ? 'Next month'
                        : 'Following month'}
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {month.label}
                  </h3>
                </div>

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    positive
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {positive ? (
                    <TrendingUp size={18} />
                  ) : (
                    <TrendingDown size={18} />
                  )}
                </div>
              </div>

              <p className="mt-6 text-2xl font-semibold text-slate-900">
                {formatCurrency(month.ending_balance)}
              </p>

              <p
                className={`mt-1 text-sm font-medium ${
                  positive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {positive ? '+' : ''}
                {formatCurrency(month.net_change)} expected change
              </p>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Expected income</span>

                  <span className="font-medium text-emerald-600">
                    {formatCompactCurrency(month.expected_income)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Expected expenses</span>

                  <span className="font-medium text-red-600">
                    {formatCompactCurrency(month.expected_expenses)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Goal contributions</span>

                  <span className="font-medium text-slate-700">
                    {formatCompactCurrency(month.goal_contributions)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ForecastMonthCards;
