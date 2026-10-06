import { ArrowDownRight, ArrowUpRight, Landmark } from 'lucide-react';

import { formatCurrency } from '../../utils/accounts';

type NetWorthSummaryProps = {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  accountCount: number;
};

function NetWorthSummary({
  netWorth,
  totalAssets,
  totalLiabilities,
  accountCount,
}: NetWorthSummaryProps) {
  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div
          className={`p-5 sm:p-7 ${
            netWorth < 0 ? 'bg-rose-50' : 'bg-emerald-50'
          }`}
        >
          <p className="text-sm font-medium text-slate-600">Net worth</p>
          <p
            className={`mt-3 wrap-break-word text-3xl font-semibold sm:text-4xl ${
              netWorth < 0 ? 'text-rose-700' : 'text-emerald-800'
            }`}
          >
            {formatCurrency(netWorth)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Assets minus liabilities
          </p>
        </div>

        <div className="grid sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
          <div className="border-t border-slate-200 p-5 sm:border-t-0 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <ArrowUpRight
                size={15}
                className="text-emerald-700"
                aria-hidden="true"
              />
              Total assets
            </div>
            <p
              className={`mt-3 text-lg font-semibold tabular-nums ${
                totalAssets < 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {formatCurrency(totalAssets)}
            </p>
          </div>

          <div className="border-t border-slate-200 p-5 sm:border-t-0 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <ArrowDownRight
                size={15}
                className="text-rose-700"
                aria-hidden="true"
              />
              Total liabilities
            </div>
            <p className="mt-3 text-lg font-semibold text-rose-700 tabular-nums">
              {formatCurrency(totalLiabilities)}
            </p>
          </div>

          <div className="border-t border-slate-200 p-5 sm:border-t-0 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Landmark
                size={15}
                className="text-slate-500"
                aria-hidden="true"
              />
              Active accounts
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900 tabular-nums">
              {accountCount}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NetWorthSummary;
