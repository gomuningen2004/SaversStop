import { useMemo, useState } from 'react';

import { Plus } from 'lucide-react';

import AddAccountModal from '../components/AddAccountModal';
import AccountCard from '../components/AccountCard';
import NetWorthSummary from '../components/NetWorthSummary';

import { useAccounts } from '../hooks/useAccounts';

import {
  calculateNetWorth,
  calculateTotalAssets,
  calculateTotalLiabilities,
  getActiveAccounts,
  getAssetAccounts,
  getLiabilityAccounts,
  formatCurrency,
} from '../utils/accounts';

function Accounts() {
  const {
    accounts,
    accountTypes,
    loading,
    error,
    loadAccounts,
    deactivateAccount,
  } = useAccounts();

  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  /*
   * ---------------------------------------------------------
   * ACCOUNT GROUPS
   * ---------------------------------------------------------
   */

  const activeAccounts = useMemo(() => getActiveAccounts(accounts), [accounts]);

  const assetAccounts = useMemo(
    () => getAssetAccounts(accounts, accountTypes),
    [accounts, accountTypes],
  );

  const liabilityAccounts = useMemo(
    () => getLiabilityAccounts(accounts, accountTypes),
    [accounts, accountTypes],
  );

  /*
   * ---------------------------------------------------------
   * TOTALS
   * ---------------------------------------------------------
   */

  const totalAssets = useMemo(
    () => calculateTotalAssets(assetAccounts),
    [assetAccounts],
  );

  const totalLiabilities = useMemo(
    () => calculateTotalLiabilities(liabilityAccounts),
    [liabilityAccounts],
  );

  const netWorth = calculateNetWorth(totalAssets, totalLiabilities);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-slate-500">Loading accounts...</p>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <main className="px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Accounts</h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage where your money is and what you owe.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddAccountModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Add Account
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* NET WORTH */}

        <NetWorthSummary
          netWorth={netWorth}
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
          accountCount={activeAccounts.length}
        />

        {/* ASSETS */}

        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assets</h2>

              <p className="mt-1 text-sm text-slate-500">
                Money and things you own.
              </p>
            </div>

            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(totalAssets)}
            </p>
          </div>

          {assetAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">No asset accounts.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assetAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  accountTypes={accountTypes}
                  onDeactivate={deactivateAccount}
                />
              ))}
            </div>
          )}
        </section>

        {/* LIABILITIES */}

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Liabilities
              </h2>

              <p className="mt-1 text-sm text-slate-500">Money you owe.</p>
            </div>

            <p className="text-sm font-semibold text-red-600">
              {formatCurrency(totalLiabilities)}
            </p>
          </div>

          {liabilityAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">No liabilities.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liabilityAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  accountTypes={accountTypes}
                  onDeactivate={deactivateAccount}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ADD ACCOUNT MODAL */}

      <AddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onSuccess={async () => {
          setShowAddAccountModal(false);
          await loadAccounts();
        }}
      />
    </main>
  );
}

export default Accounts;
