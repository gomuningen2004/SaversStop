import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Budget, Category, Transaction } from '../types';
import {
  analyzeBudgets,
  type BudgetStatus,
  formatBudgetMonth,
  getBudgetTotals,
  getCurrentMonth,
} from '../utils/budgets';

const API_URL = '/data';

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getBudgetProgress(percentageUsed: number, status: BudgetStatus) {
  const progressClass =
    status === 'exceeded'
      ? 'bg-red-500'
      : status === 'critical'
        ? 'bg-orange-500'
        : status === 'warning'
          ? 'bg-amber-500'
          : 'bg-emerald-500';

  return {
    width: Math.min(percentageUsed, 100),
    className: progressClass,
  };
}

export function useBudgetsPage() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [budgetsResponse, categoriesResponse, transactionsResponse] =
          await Promise.all([
            fetch(`${API_URL}/budgets.json`),
            fetch(`${API_URL}/categories.json`),
            fetch(`${API_URL}/transactions.json`),
          ]);

        if (
          !budgetsResponse.ok ||
          !categoriesResponse.ok ||
          !transactionsResponse.ok
        ) {
          throw new Error('Failed to load budget data');
        }

        const [budgetsData, categoriesData, transactionsData] =
          await Promise.all([
            budgetsResponse.json(),
            categoriesResponse.json(),
            transactionsResponse.json(),
          ]);

        const normalizedBudgets: Budget[] = (budgetsData.budgets ?? []).map(
          (budget: {
            id: string;
            month: string;
            category_id: string;
            amount: number;
          }) => ({
            id: budget.id,
            month: budget.month,
            categoryId: budget.category_id,
            amount: Number(budget.amount),
          }),
        );
        const normalizedCategories: Category[] = (
          categoriesData.categories ?? []
        ).map((category: { id: string; name: string; active: boolean }) => ({
          id: category.id,
          name: category.name,
          active: category.active,
        }));
        const normalizedTransactions: Transaction[] = (
          transactionsData.transactions ?? []
        ).map(
          (transaction: {
            id: string;
            transaction_date: string;
            reason?: string | null;
            category_id: string;
            account_id: string;
            amount: number;
            type: 'sent' | 'received';
            transfer_id?: string | null;
          }) => ({
            id: transaction.id,
            transactionDate: transaction.transaction_date,
            reason: transaction.reason,
            categoryId: transaction.category_id,
            accountId: transaction.account_id,
            amount: Number(transaction.amount),
            type: transaction.type,
            transferId: transaction.transfer_id ?? null,
          }),
        );

        setBudgets(normalizedBudgets);
        setCategories(normalizedCategories);
        setTransactions(normalizedTransactions);
      } catch (error) {
        console.error('Failed to load budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const analyses = useMemo(
    () =>
      analyzeBudgets(budgets, categories, transactions, selectedMonth).sort(
        (a, b) => b.spent - a.spent,
      ),
    [budgets, categories, transactions, selectedMonth],
  );
  const totals = useMemo(() => getBudgetTotals(analyses), [analyses]);
  const availableCategories = useMemo(() => {
    const usedCategoryIds = budgets
      .filter((budget) => budget.month === selectedMonth)
      .filter(
        (budget) => editingBudget === null || budget.id !== editingBudget.id,
      )
      .map((budget) => budget.categoryId);

    return categories.filter(
      (category) =>
        category.active &&
        category.name.toLowerCase() !== 'salary' &&
        !usedCategoryIds.includes(category.id),
    );
  }, [budgets, categories, selectedMonth, editingBudget]);
  const criticalBudgets = analyses.filter(
    (item) => item.status === 'critical' || item.status === 'exceeded',
  );
  const warningBudgets = analyses.filter((item) => item.status === 'warning');

  function changeMonth(direction: number) {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1 + direction, 1);
    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    );
  }

  function openAddModal() {
    setEditingBudget(null);
    setCategoryId('');
    setAmount('');
    setShowModal(true);
  }

  function openEditModal(budget: Budget) {
    setEditingBudget(budget);
    setCategoryId(budget.categoryId);
    setAmount(budget.amount.toString());
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingBudget(null);
    setCategoryId('');
    setAmount('');
  }

  function saveBudget() {
    const parsedAmount = Number(amount);
    if (!categoryId) {
      alert('Please select a category.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid budget amount.');
      return;
    }

    const duplicate = budgets.some(
      (budget) =>
        budget.month === selectedMonth &&
        budget.categoryId === categoryId &&
        budget.id !== editingBudget?.id,
    );
    if (duplicate) {
      alert('A budget already exists for this category in this month.');
      return;
    }

    if (editingBudget) {
      setBudgets((currentBudgets) =>
        currentBudgets.map((budget) =>
          budget.id === editingBudget.id
            ? {
                ...budget,
                month: selectedMonth,
                categoryId,
                amount: parsedAmount,
              }
            : budget,
        ),
      );
      closeModal();
      return;
    }

    const newBudget: Budget = {
      id: crypto.randomUUID(),
      month: selectedMonth,
      categoryId,
      amount: parsedAmount,
    };
    setBudgets((currentBudgets) => [...currentBudgets, newBudget]);
    closeModal();
  }

  function deleteBudget(budget: Budget) {
    const category = categories.find((item) => item.id === budget.categoryId);
    const confirmed = window.confirm(
      `Delete the ${
        category?.name ?? ''
      } budget for ${formatBudgetMonth(budget.month)}?`,
    );
    if (!confirmed) return;
    setBudgets((currentBudgets) =>
      currentBudgets.filter((item) => item.id !== budget.id),
    );
  }

  function goToManageCategories() {
    navigate('/categories/manage');
  }

  return {
    analyses,
    amount,
    availableCategories,
    categories,
    categoryId,
    changeMonth,
    closeModal,
    criticalBudgets,
    deleteBudget,
    editingBudget,
    formatAmount,
    formatBudgetMonth,
    getBudgetProgress,
    getCurrentMonth,
    loading,
    navigateToManageCategories: goToManageCategories,
    openAddModal,
    openEditModal,
    saveBudget,
    selectedMonth,
    setAmount,
    setCategoryId,
    setSelectedMonth,
    showModal,
    totals,
    warningBudgets,
  };
}
