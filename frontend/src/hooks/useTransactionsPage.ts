import { useMemo, useState } from 'react';

import { useTransactionData } from './useTransactionData';
import {
  buildTransfers,
  getDateKey,
  getDateRange,
  paginate,
  type DateFilter,
} from '../utils/transactions';

const ITEMS_PER_PAGE = 10;

export function useTransactionsPage() {
  const transactionData = useTransactionData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('this-year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [transactionPage, setTransactionPage] = useState(1);
  const [transferPage, setTransferPage] = useState(1);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const resetPages = () => {
    setTransactionPage(1);
    setTransferPage(1);
  };

  const handleFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
    resetPages();
  };

  const handleStartDateChange = (date: string) => {
    setCustomStartDate(date);
    resetPages();
  };

  const handleEndDateChange = (date: string) => {
    setCustomEndDate(date);
    resetPages();
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    resetPages();
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    resetPages();
  };

  const resetFilters = () => {
    setDateFilter('this-year');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedAccount('all');
    setSelectedCategory('all');
    resetPages();
  };

  const categoryNames = useMemo(
    () =>
      new Map(
        transactionData.categories.map((category) => [
          category.id,
          category.name,
        ]),
      ),
    [transactionData.categories],
  );
  const accountNames = useMemo(
    () =>
      new Map(
        transactionData.accounts.map((account) => [account.id, account.name]),
      ),
    [transactionData.accounts],
  );
  const getAccountName = (id: string) =>
    accountNames.get(id) ?? 'Unknown Account';

  const dateFilteredTransactions = useMemo(() => {
    if (dateFilter === 'all-time') return transactionData.transactions;

    const { start, end } = getDateRange(
      dateFilter,
      customStartDate,
      customEndDate,
    );
    if (!start || !end || start > end) return [];

    return transactionData.transactions.filter((transaction) => {
      const date = getDateKey(transaction.transactionDate);
      return date >= start && date <= end;
    });
  }, [
    transactionData.transactions,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  const regularTransactions = useMemo(
    () =>
      dateFilteredTransactions
        .filter(
          (transaction) =>
            !transaction.transferId &&
            (selectedAccount === 'all' ||
              transaction.accountId === selectedAccount) &&
            (selectedCategory === 'all' ||
              transaction.categoryId === selectedCategory),
        )
        .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [dateFilteredTransactions, selectedAccount, selectedCategory],
  );
  const transfers = useMemo(
    () =>
      buildTransfers(dateFilteredTransactions).filter(
        (transfer) =>
          selectedAccount === 'all' ||
          transfer.sent.accountId === selectedAccount ||
          transfer.received.accountId === selectedAccount,
      ),
    [dateFilteredTransactions, selectedAccount],
  );
  const transactionPager = paginate(
    regularTransactions,
    transactionPage,
    ITEMS_PER_PAGE,
  );
  const transferPager = paginate(transfers, transferPage, ITEMS_PER_PAGE);

  return {
    ...transactionData,
    showAddModal,
    openAddModal,
    closeAddModal,
    dateFilter,
    customStartDate,
    customEndDate,
    selectedAccount,
    selectedCategory,
    hasActiveFilters:
      dateFilter !== 'this-year' ||
      Boolean(customStartDate || customEndDate) ||
      selectedAccount !== 'all' ||
      selectedCategory !== 'all',
    transactionPage,
    transferPage,
    setTransactionPage,
    setTransferPage,
    handleFilterChange,
    handleStartDateChange,
    handleEndDateChange,
    handleAccountChange,
    handleCategoryChange,
    resetFilters,
    categoryNames,
    getAccountName,
    regularTransactions,
    transfers,
    transactionPager,
    transferPager,
  };
}
