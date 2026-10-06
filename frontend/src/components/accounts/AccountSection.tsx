import type { Account, AccountType } from '../../types';
import { formatCurrency } from '../../utils/accounts';
import AccountCard from './AccountCard';

type AccountSectionProps = {
  title: string;
  description: string;
  total: number;
  totalColor: 'green' | 'red';
  accounts: Account[];
  accountTypes: AccountType[];
  emptyMessage: string;
  onEdit: (account: Account) => void;
  onDeactivate: (account: Account) => void;
};

function AccountSection({
  title,
  description,
  total,
  totalColor,
  accounts,
  accountTypes,
  emptyMessage,
  onEdit,
  onDeactivate,
}: AccountSectionProps) {
  return (
    <section className="mb-10 last:mb-0">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
              {accounts.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-slate-500">Section total</p>
          <p
            className={`mt-1 text-sm font-semibold tabular-nums ${
              totalColor === 'green' ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              accountTypes={accountTypes}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default AccountSection;
