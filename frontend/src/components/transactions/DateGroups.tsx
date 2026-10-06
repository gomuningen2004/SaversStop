import type { ReactNode } from 'react';

import { formatDate, groupByDate } from '../../utils/transactions';

type DateGroupsProps<T> = {
  items: T[];
  getDate: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  itemsClassName?: string;
};

function DateGroups<T>({
  items,
  getDate,
  renderItem,
  itemsClassName = 'space-y-2',
}: DateGroupsProps<T>) {
  const groups = groupByDate(items, getDate);
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {dates.map((date) => (
        <div key={date}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {formatDate(date)}
          </h3>

          <div className={itemsClassName}>{groups[date].map(renderItem)}</div>
        </div>
      ))}
    </div>
  );
}

export default DateGroups;
