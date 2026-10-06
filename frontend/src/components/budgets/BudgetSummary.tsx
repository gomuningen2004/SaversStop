type BudgetSummaryProps = {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
  formatAmount: (amount: number) => string;
};

function BudgetSummary({
  totalBudget,
  totalSpent,
  totalRemaining,
  percentageUsed,
  formatAmount,
}: BudgetSummaryProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Total Budget</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatAmount(totalBudget)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Total Spent</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatAmount(totalSpent)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {percentageUsed.toFixed(1)}% of budget used
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Remaining</p>
        <p
          className={`mt-2 text-2xl font-semibold ${
            totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {formatAmount(Math.abs(totalRemaining))}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {totalRemaining >= 0 ? 'Available to spend' : 'Over total budget'}
        </p>
      </div>
    </div>
  );
}

export default BudgetSummary;
