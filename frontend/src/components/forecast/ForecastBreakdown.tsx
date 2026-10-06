import type { CurrencyFormatter, ForecastMonth } from './types';

type ForecastBreakdownProps = {
  months: ForecastMonth[];
  formatCurrency: CurrencyFormatter;
  formatCompactCurrency: CurrencyFormatter;
};

function ForecastBreakdown({
  months,
  formatCurrency,
  formatCompactCurrency,
}: ForecastBreakdownProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Forecast breakdown
        </h2>

        <p className="text-sm text-slate-500">
          The factors SaversStop is using to estimate your future balance.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-5">
          <div>Month</div>
          <div>Historical spending</div>
          <div>Goals</div>
          <div>Expected income</div>
          <div>Forecast balance</div>
        </div>

        {months.map((month) => (
          <div
            key={month.month}
            className="grid grid-cols-2 gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 md:grid-cols-5 md:items-center"
          >
            <div>
              <p className="font-medium text-slate-900">{month.label}</p>

              <p className="mt-1 text-xs text-slate-500">
                Starting: {formatCompactCurrency(month.starting_balance)}
              </p>
            </div>

            <div>
              <p className="font-medium text-slate-800">
                {formatCurrency(month.historical_spending)}
              </p>

              <p className="text-xs text-slate-400">weighted monthly average</p>
            </div>

            <div>
              <p className="font-medium text-slate-800">
                {formatCurrency(month.goal_contributions)}
              </p>

              <p className="text-xs text-slate-400">planned</p>
            </div>

            <div>
              <p className="font-medium text-emerald-600">
                {formatCurrency(month.expected_income)}
              </p>

              <p className="text-xs text-slate-400">expected</p>
            </div>

            <div>
              <p
                className={`font-semibold ${
                  month.ending_balance >= 0
                    ? 'text-indigo-700'
                    : 'text-red-700'
                }`}
              >
                {formatCurrency(month.ending_balance)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ForecastBreakdown;
