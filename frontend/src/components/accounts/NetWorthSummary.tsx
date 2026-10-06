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
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-medium text-slate-500">Net Worth</p>

      <p
        className={`mt-2 text-3xl font-semibold ${
          netWorth >= 0 ? 'text-slate-900' : 'text-red-600'
        }`}
      >
        {formatCurrency(Math.abs(netWorth))}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Total Assets</p>

          <p className="mt-1 text-lg font-semibold text-green-600">
            {formatCurrency(totalAssets)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Total Liabilities</p>

          <p className="mt-1 text-lg font-semibold text-red-600">
            {formatCurrency(totalLiabilities)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Accounts</p>

          <p className="mt-1 text-lg font-semibold text-slate-900">
            {accountCount}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NetWorthSummary;
