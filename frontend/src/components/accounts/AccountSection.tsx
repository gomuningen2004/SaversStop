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
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <p
          className={`text-sm font-semibold ${
            totalColor === 'green' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatCurrency(total)}
        </p>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
