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
        transactionData.accounts.map((account) => [
          account.id,
          account.name,
        ]),
      ),
    [transactionData.accounts],
  );
  const getAccountName = (id: string) =>
    accountNames.get(id) ?? 'Unknown Account';

  const filteredTransactions = useMemo(() => {
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
      filteredTransactions
        .filter((transaction) => !transaction.transferId)
        .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [filteredTransactions],
  );
  const transfers = useMemo(
    () => buildTransfers(filteredTransactions),
    [filteredTransactions],
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
    transactionPage,
    transferPage,
    setTransactionPage,
    setTransferPage,
    handleFilterChange,
    handleStartDateChange,
    handleEndDateChange,
    categoryNames,
    getAccountName,
    regularTransactions,
    transfers,
    transactionPager,
    transferPager,
  };
}
