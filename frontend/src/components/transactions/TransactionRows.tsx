import { ArrowDownLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

import type { Transaction } from '../../types';
import {
  formatCategory,
  formatCurrency,
  type Transfer,
} from '../../utils/transactions';

const rowClass =
  'flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300 hover:shadow-sm sm:gap-4 sm:px-4 sm:py-4';

const iconWrapperClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11';

export function TransactionRow({
  transaction,
  categoryName,
  accountName,
}: {
  transaction: Transaction;
  categoryName: string;
  accountName: string;
}) {
  const isReceived = transaction.type === 'received';

  return (
    <div className={rowClass}>
      <div
        className={`${iconWrapperClass} ${isReceived ? 'bg-green-50' : 'bg-red-50'}`}
      >
        {isReceived ? (
          <ArrowDownLeft size={20} strokeWidth={2} className="text-green-600" />
        ) : (
          <ArrowUpRight size={20} strokeWidth={2} className="text-red-600" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {transaction.reason || 'Transaction'}
        </p>

        <span className="mt-1.5 inline-block max-w-full truncate rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 sm:px-2.5">
          {formatCategory(categoryName)}
        </span>
      </div>

      <div className="w-auto shrink-0 text-right sm:min-w-27.5">
        <p
          className={`text-sm font-semibold whitespace-nowrap ${
            isReceived ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isReceived ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </p>

        <p className="mt-1 truncate text-xs text-slate-500">{accountName}</p>
      </div>
    </div>
  );
}

export function TransferRow({
  transfer,
  getAccountName,
}: {
  transfer: Transfer;
  getAccountName: (accountId: string) => string;
}) {
  const accountLabelClass =
    'max-w-27.5 truncate text-sm font-medium text-slate-900 sm:max-w-none';

  return (
    <div className={rowClass}>
      <div className={`${iconWrapperClass} bg-blue-50`}>
        <ArrowRight size={20} strokeWidth={2} className="text-blue-600" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={accountLabelClass}>
            {getAccountName(transfer.sent.accountId)}
          </span>

          <ArrowRight
            size={15}
            strokeWidth={2}
            className="shrink-0 text-slate-400"
          />

          <span className={accountLabelClass}>
            {getAccountName(transfer.received.accountId)}
          </span>
        </div>

        <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          Self Transfer
        </span>
      </div>

      <p className="shrink-0 text-right text-sm font-semibold whitespace-nowrap text-slate-900">
        {formatCurrency(transfer.sent.amount)}
      </p>
    </div>
  );
}
