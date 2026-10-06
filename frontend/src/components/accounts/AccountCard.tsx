import {
  Banknote,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wallet,
} from 'lucide-react';

import type { Account, AccountType } from '../../types';

import { formatCurrency, getAccountType } from '../../utils/accounts';

type AccountCardProps = {
  account: Account;
  accountTypes: AccountType[];
  onEdit: (account: Account) => void;
  onDeactivate: (account: Account) => void;
};

const accountTypeIcons: Record<string, typeof Landmark> = {
  Bank: Landmark,
  Cash: Banknote,
  Wallet: Wallet,
  'Fixed Deposit': Landmark,
  Investment: Banknote,
  'Credit Card': CreditCard,
  Loan: Banknote,
};

function AccountCard({
  account,
  accountTypes,
  onEdit,
  onDeactivate,
}: AccountCardProps) {
  const accountType = getAccountType(account, accountTypes);

  const accountClassification = accountType?.classification;

  const Icon = accountTypeIcons[accountType?.name ?? ''] ?? Landmark;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {/* HEADER */}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Icon size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">{account.name}</h3>

            <p className="mt-1 text-xs text-slate-500">
              {accountType?.name ?? 'Unknown Account Type'}
            </p>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="relative">
          <details>
            <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <MoreHorizontal size={18} />
            </summary>

            <div className="absolute right-0 top-9 z-10 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={(event) => {
                  const actionsMenu = event.currentTarget.closest('details');

                  if (actionsMenu) {
                    actionsMenu.open = false;
                  }

                  onEdit(account);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDeactivate(account)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Deactivate
              </button>
            </div>
          </details>
        </div>
      </div>

      {/* BALANCE */}

      <div className="mt-6">
        <p className="text-xs text-slate-500">
          {accountClassification === 'asset' ? 'Current Value' : 'Outstanding'}
        </p>

        <p
          className={`mt-1 text-2xl font-semibold ${
            accountClassification === 'liability'
              ? 'text-red-600'
              : 'text-slate-900'
          }`}
        >
          {formatCurrency(Math.abs(account.currentBalance))}
        </p>
      </div>
    </div>
  );
}

export default AccountCard;
