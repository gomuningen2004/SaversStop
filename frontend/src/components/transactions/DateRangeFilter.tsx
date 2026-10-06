import { useRef } from 'react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';

import type { Account, Category } from '../../types';
import type { DateFilter } from '../../utils/transactions';

const OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'this-year', label: 'This Year' },
  { value: 'previous-year', label: 'Previous Year' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

const inputClass =
  'block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

type DateRangeFilterProps = {
  value: DateFilter;
  startDate: string;
  endDate: string;
  selectedAccount: string;
  selectedCategory: string;
  hasActiveFilters: boolean;
  accounts: Account[];
  categories: Category[];
  onChange: (filter: DateFilter) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onAccountChange: (accountId: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onReset: () => void;
};

type FilterFieldsProps = Omit<
  DateRangeFilterProps,
  'hasActiveFilters' | 'onReset'
> & {
  idPrefix: string;
  layoutClass: string;
};

function FilterFields({
  idPrefix,
  layoutClass,
  value,
  startDate,
  endDate,
  selectedAccount,
  selectedCategory,
  accounts,
  categories,
  onChange,
  onStartDateChange,
  onEndDateChange,
  onAccountChange,
  onCategoryChange,
}: FilterFieldsProps) {
  const isCustom = value === 'custom';
  const hasInvalidRange =
    isCustom && startDate && endDate && startDate > endDate;

  return (
    <>
      <div className={layoutClass}>
        <div className="min-w-0">
          <label
            htmlFor={`${idPrefix}-date-range`}
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Date range
          </label>
          <select
            id={`${idPrefix}-date-range`}
            value={value}
            onChange={(event) => onChange(event.target.value as DateFilter)}
            className={inputClass}
          >
            {OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`${idPrefix}-account`}
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Account
          </label>
          <select
            id={`${idPrefix}-account`}
            value={selectedAccount}
            onChange={(event) => onAccountChange(event.target.value)}
            className={inputClass}
          >
            <option value="all">All Accounts</option>
            {accounts
              .filter((account) => account.active)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`${idPrefix}-category`}
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Category
          </label>
          <select
            id={`${idPrefix}-category`}
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className={inputClass}
          >
            <option value="all">All Categories</option>
            {categories
              .filter((category) => category.active)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name.charAt(0).toUpperCase() +
                    category.name.slice(1)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {isCustom && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label
              htmlFor={`${idPrefix}-start-date`}
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              From
            </label>
            <input
              id={`${idPrefix}-start-date`}
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor={`${idPrefix}-end-date`}
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              To
            </label>
            <input
              id={`${idPrefix}-end-date`}
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {hasInvalidRange && (
        <p className="mt-3 text-xs font-medium text-red-500" role="alert">
          The start date cannot be after the end date.
        </p>
      )}
    </>
  );
}

function DateRangeFilter(props: DateRangeFilterProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selectedDateLabel =
    OPTIONS.find((option) => option.value === props.value)?.label ??
    'Date range';
  const closeMobileFilters = () => dialogRef.current?.close();
  const filterFieldsProps = {
    ...props,
    idPrefix: 'transaction-filter',
  };

  return (
    <section className="mb-6 sm:mb-8">
      <div className="hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:block sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
            <p className="mt-1 text-xs text-slate-500">
              Narrow by date, account, or category.
            </p>
          </div>
          {props.hasActiveFilters && (
            <button
              type="button"
              onClick={props.onReset}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          )}
        </div>
        <FilterFields
          {...filterFieldsProps}
          layoutClass="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        />
      </div>

      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          aria-label="Open transaction filters"
          title="Open filters"
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
            <SlidersHorizontal size={17} aria-hidden="true" />
            Filters
            {props.hasActiveFilters && (
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-label="Active filters"
              />
            )}
          </span>
          <span className="text-xs text-slate-500">{selectedDateLabel}</span>
        </button>

        <dialog
          ref={dialogRef}
          aria-labelledby="mobile-transaction-filters-title"
          onClick={(event) => {
            if (event.target === dialogRef.current) closeMobileFilters();
          }}
          className="fixed inset-x-0 bottom-0 top-auto m-0 box-border max-h-[85dvh] w-screen max-w-[100vw] overflow-y-auto rounded-t-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/40 sm:hidden"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2
                id="mobile-transaction-filters-title"
                className="text-base font-semibold text-slate-900"
              >
                Filters
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Narrow by date, account, or category.
              </p>
            </div>
            <button
              type="button"
              onClick={closeMobileFilters}
              aria-label="Close filters"
              className="-mr-2 -mt-1 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="px-5 py-4">
            <FilterFields
              {...filterFieldsProps}
              idPrefix="mobile-transaction-filter"
              layoutClass="grid gap-4"
            />
          </div>

          <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white px-5 py-4">
            {props.hasActiveFilters && (
              <button
                type="button"
                onClick={props.onReset}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={closeMobileFilters}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Done
            </button>
          </div>
        </dialog>
      </div>
    </section>
  );
}

export default DateRangeFilter;
