import { ChevronLeft, ChevronRight } from 'lucide-react';

type BudgetMonthSelectorProps = {
  month: string;
  formatMonth: (month: string) => string;
  currentMonth: () => string;
  onMonthChange: (direction: number) => void;
  onSelectMonth: (month: string) => void;
};

function BudgetMonthSelector({
  month,
  formatMonth,
  currentMonth,
  onMonthChange,
  onSelectMonth,
}: BudgetMonthSelectorProps) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <button
        onClick={() => onMonthChange(-1)}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-900">
          {formatMonth(month)}
        </p>
        <button
          onClick={() => onSelectMonth(currentMonth())}
          className="mt-0.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          Go to current month
        </button>
      </div>
      <button
        onClick={() => onMonthChange(1)}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default BudgetMonthSelector;
