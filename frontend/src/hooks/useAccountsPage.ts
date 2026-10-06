import { useMemo, useState } from 'react';

import { useAccounts } from './useAccounts';
import type { Account } from '../types';
import {
  calculateNetWorth,
  calculateTotalAssets,
  calculateTotalLiabilities,
  getActiveAccounts,
  getAssetAccounts,
  getLiabilityAccounts,
} from '../utils/accounts';

export function useAccountsPage() {
  const accountData = useAccounts();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const openAddAccountModal = () => {
    setAccountToEdit(null);
    setIsAccountModalOpen(true);
  };

  const openEditAccountModal = (account: Account) => {
    setAccountToEdit(account);
    setIsAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    setAccountToEdit(null);
  };

  const handleAccountSaveSuccess = async () => {
    closeAccountModal();
    await accountData.loadAccounts();
  };

  const activeAccounts = useMemo(
    () => getActiveAccounts(accountData.accounts),
    [accountData.accounts],
  );
  const assetAccounts = useMemo(
    () => getAssetAccounts(accountData.accounts, accountData.accountTypes),
    [accountData.accounts, accountData.accountTypes],
  );
  const liabilityAccounts = useMemo(
    () => getLiabilityAccounts(accountData.accounts, accountData.accountTypes),
    [accountData.accounts, accountData.accountTypes],
  );
  const totalAssets = useMemo(
    () => calculateTotalAssets(assetAccounts),
    [assetAccounts],
  );
  const totalLiabilities = useMemo(
    () => calculateTotalLiabilities(liabilityAccounts),
    [liabilityAccounts],
  );
  const netWorth = calculateNetWorth(totalAssets, totalLiabilities);

  return {
    ...accountData,
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
  };
}
