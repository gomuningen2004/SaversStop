import type { DateFilter } from '../../utils/transactions';

const OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'this-year', label: 'This Year' },
  { value: 'previous-year', label: 'Previous Year' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

const dateInputClass =
  'block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400';

type DateRangeFilterProps = {
  value: DateFilter;
  startDate: string;
  endDate: string;
  onChange: (filter: DateFilter) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
};

function DateRangeFilter({
  value,
  startDate,
  endDate,
  onChange,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  const isCustom = value === 'custom';
  const hasInvalidRange =
    isCustom && startDate && endDate && startDate > endDate;

  return (
    /* Plain (no card) on phones, card from sm and up */
    <section className="mb-6 sm:mb-8 sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:p-5">
      {/* Title + helper text only on larger screens */}
      <div className="mb-4 hidden sm:block">
        <h2 className="text-sm font-semibold text-slate-900">Date Range</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose which transactions you want to view.
        </p>
      </div>

      {/* Swipeable single row on phones, wrapping row on larger screens */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition sm:rounded-lg sm:px-3 ${
              value === option.value
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label
              htmlFor="start-date"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              From
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={dateInputClass}
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="end-date"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              To
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className={dateInputClass}
            />
          </div>
        </div>
      )}

      {hasInvalidRange && (
        <p className="mt-3 text-xs font-medium text-red-500">
          The start date cannot be after the end date.
        </p>
      )}
    </section>
  );
}

export default DateRangeFilter;
