import { Info } from 'lucide-react';

import type { CurrencyFormatter, ForecastMonth } from './types';

type ForecastExplanationProps = {
  month: ForecastMonth;
  monthlyNet: number;
  formatCurrency: CurrencyFormatter;
};

function ForecastExplanation({
  month,
  monthlyNet,
  formatCurrency,
}: ForecastExplanationProps) {
  return (
    <section className="mb-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Info size={18} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              How this month's forecast works
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              SaversStop combines your recent financial activity with your
              active goals to estimate your future balance.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-500">Expected income</p>

            <p className="mt-1 text-lg font-semibold text-emerald-600">
              {formatCurrency(month.expected_income)}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Expected expenses</p>

            <p className="mt-1 text-lg font-semibold text-red-600">
              {formatCurrency(month.expected_expenses)}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Planned goals</p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatCurrency(month.goal_contributions)}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Expected net change</p>

            <p
              className={`mt-1 text-lg font-semibold ${
                monthlyNet >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {monthlyNet >= 0 ? '+' : ''}
              {formatCurrency(monthlyNet)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForecastExplanation;
