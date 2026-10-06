import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet } from 'lucide-react';

import type { CurrencyFormatter } from './types';

type CurrentPositionProps = {
  currentBalance: number;
  income: number;
  spending: number;
  endOfMonthForecast: number;
  formatCurrency: CurrencyFormatter;
};

function CurrentPosition({
  currentBalance,
  income,
  spending,
  endOfMonthForecast,
  formatCurrency,
}: CurrentPositionProps) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">This month</h2>

        <p className="text-sm text-slate-500">
          Your current position and expected end-of-month result.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Wallet size={16} />
            Current balance
          </div>

          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatCurrency(currentBalance)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ArrowUpRight size={16} className="text-emerald-500" />
            Actual income
          </div>

          <p className="mt-3 text-2xl font-semibold text-emerald-600">
            {formatCurrency(income)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ArrowDownRight size={16} className="text-red-500" />
            Actual spending
          </div>

          <p className="mt-3 text-2xl font-semibold text-red-600">
            {formatCurrency(spending)}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <div className="flex items-center gap-2 text-sm text-indigo-700">
            <TrendingUp size={16} />
            End-of-month forecast
          </div>

          <p className="mt-3 text-2xl font-semibold text-indigo-900">
            {formatCurrency(endOfMonthForecast)}
          </p>
        </div>
      </div>
    </section>
  );
}

export default CurrentPosition;
