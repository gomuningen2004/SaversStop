import type { DateFilter } from '../utils/transactions';

const OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'this-year', label: 'This Year' },
  { value: 'previous-year', label: 'Previous Year' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

const dateInputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400';

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
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Date Range</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose which transactions you want to view.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
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
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
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

          <div>
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
