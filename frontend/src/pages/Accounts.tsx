import { Plus } from 'lucide-react';

import AccountModal from '../components/accounts/AccountModal';
import AccountSection from '../components/accounts/AccountSection';
import NetWorthSummary from '../components/accounts/NetWorthSummary';

import { useAccountsPage } from '../hooks/useAccountsPage';

function Accounts() {
  const {
    accountTypes,
    loading,
    error,
    deactivateAccount,
    isAccountModalOpen,
    accountToEdit,
    openAddAccountModal,
    openEditAccountModal,
    closeAccountModal,
    handleAccountSaveSuccess,
    activeAccounts,
    assetAccounts,
    liabilityAccounts,
    totalAssets,
    totalLiabilities,
    netWorth,
  } = useAccountsPage();

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
            onClick={openAddAccountModal}
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

        <AccountSection
          title="Assets"
          description="Money and things you own."
          total={totalAssets}
          totalColor="green"
          accounts={assetAccounts}
          accountTypes={accountTypes}
          emptyMessage="No asset accounts."
          onEdit={openEditAccountModal}
          onDeactivate={deactivateAccount}
        />

        <AccountSection
          title="Liabilities"
          description="Money you owe."
          total={totalLiabilities}
          totalColor="red"
          accounts={liabilityAccounts}
          accountTypes={accountTypes}
          emptyMessage="No liabilities."
          onEdit={openEditAccountModal}
          onDeactivate={deactivateAccount}
        />
      </div>

      {/* ADD ACCOUNT MODAL */}

      <AccountModal
        isOpen={isAccountModalOpen}
        account={accountToEdit}
        onClose={closeAccountModal}
        onSuccess={handleAccountSaveSuccess}
      />
    </main>
  );
}

export default Accounts;
