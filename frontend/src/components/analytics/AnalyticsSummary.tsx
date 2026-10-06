import { ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingUp } from 'lucide-react';

type AnalyticsSummaryProps = {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatSigned(amount: number) {
  return `${amount < 0 ? '-' : ''}${formatCurrency(Math.abs(amount))}`;
}

function AnalyticsSummary({
  totalIncome,
  totalExpenses,
  netSavings,
  savingsRate,
}: AnalyticsSummaryProps) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <ArrowDownLeft size={19} />
          </div>

          <p className="text-sm font-medium text-slate-500">Total Income</p>
        </div>

        <p className="text-2xl font-semibold text-green-600">
          {formatCurrency(totalIncome)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <ArrowUpRight size={19} />
          </div>

          <p className="text-sm font-medium text-slate-500">Total Expenses</p>
        </div>

        <p className="text-2xl font-semibold text-red-600">
          {formatCurrency(totalExpenses)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <PiggyBank size={19} />
          </div>

          <p className="text-sm font-medium text-slate-500">Net Savings</p>
        </div>

        <p
          className={`text-2xl font-semibold ${
            netSavings >= 0 ? 'text-slate-900' : 'text-red-600'
          }`}
        >
          {formatSigned(netSavings)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <TrendingUp size={19} />
          </div>

          <p className="text-sm font-medium text-slate-500">Savings Rate</p>
        </div>

        <p
          className={`text-2xl font-semibold ${
            savingsRate >= 0 ? 'text-slate-900' : 'text-red-600'
          }`}
        >
          {savingsRate.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

export default AnalyticsSummary;
