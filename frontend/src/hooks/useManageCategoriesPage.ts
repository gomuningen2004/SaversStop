import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import type { Category, Transaction } from '../types';
import type { CategoryModalMode } from '../components/categories/ManageCategoryModal';

const API_URL = 'http://127.0.0.1:8000';

type RawCategory = {
  id: string;
  name: string;
  active: boolean;
};
type RawCategoriesResponse = { categories: RawCategory[] };
type RawTransaction = {
  id: string;
  transaction_date: string;
  reason?: string | null;
  category_id: string | null;
  account_id: string;
  amount: number | string;
  type: 'sent' | 'received';
  transfer_id?: string | null;
};
type RawTransactionsResponse = { transactions: RawTransaction[] };

export function formatCategoryName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getApiError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

export function useManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [modalMode, setModalMode] = useState<CategoryModalMode>('add');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [categoryName, setCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesResponse, transactionsResponse] = await Promise.all([
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/transactions`),
        ]);
        if (!categoriesResponse.ok || !transactionsResponse.ok) {
          throw new Error('Failed to load category data.');
        }

        const categoriesData =
          (await categoriesResponse.json()) as RawCategoriesResponse;
        const transactionsData =
          (await transactionsResponse.json()) as RawTransactionsResponse;
        const normalizedCategories: Category[] = (
          categoriesData.categories ?? []
        ).map((category) => ({
          id: category.id,
          name: category.name,
          active: category.active,
        }));
        const normalizedTransactions: Transaction[] = (
          transactionsData.transactions ?? []
        ).map((transaction) => ({
          id: transaction.id,
          transactionDate: transaction.transaction_date,
          reason: transaction.reason,
          categoryId: transaction.category_id ?? '',
          accountId: transaction.account_id,
          amount: Number(transaction.amount),
          type: transaction.type,
          transferId: transaction.transfer_id ?? null,
        }));
        setCategories(normalizedCategories);
        setTransactions(normalizedTransactions);
      } catch (err) {
        console.error(err);
        setError(`Unable to load categories. ${getApiError(err)}`);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  function openAddCategoryModal() {
    setModalMode('add');
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryError('');
    setShowCategoryModal(true);
  }

  function openEditCategoryModal(category: Category) {
    setModalMode('edit');
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryError('');
    setShowCategoryModal(true);
  }

  function closeCategoryModal() {
    if (savingCategory) return;
    setShowCategoryModal(false);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryError('');
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryError('');
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      setCategoryError('Please enter a category name.');
      return;
    }
    setSavingCategory(true);

    try {
      if (modalMode === 'add') {
        const response = await fetch(`${API_URL}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, active: true }),
        });
        if (!response.ok) {
          let message = 'Failed to create category.';
          try {
            const errorData = await response.json();
            if (typeof errorData.detail === 'string') {
              message = errorData.detail;
            }
          } catch {
            // Keep default error message.
          }
          throw new Error(message);
        }

        const newCategory = (await response.json()) as RawCategory;
        const normalizedCategory: Category = {
          id: newCategory.id,
          name: newCategory.name,
          active: newCategory.active,
        };
        setCategories((current) => [...current, normalizedCategory]);
        closeCategoryModal();
        return;
      }

      if (editingCategoryId !== null) {
        const response = await fetch(
          `${API_URL}/api/categories/${editingCategoryId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: trimmedName }),
          },
        );
        if (!response.ok) {
          let message = 'Failed to update category.';
          try {
            const errorData = await response.json();
            if (typeof errorData.detail === 'string') {
              message = errorData.detail;
            }
          } catch {
            // Keep default error message.
          }
          throw new Error(message);
        }

        const updatedCategory = (await response.json()) as RawCategory;
        const normalizedCategory: Category = {
          id: updatedCategory.id,
          name: updatedCategory.name,
          active: updatedCategory.active,
        };
        setCategories((current) =>
          current.map((category) =>
            category.id === normalizedCategory.id
              ? normalizedCategory
              : category,
          ),
        );
        closeCategoryModal();
      }
    } catch (err) {
      console.error(err);
      setCategoryError(getApiError(err));
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    const isUsed = transactions.some(
      (transaction) => transaction.categoryId === category.id,
    );
    if (isUsed) {
      window.alert(
        `"${formatCategoryName(
          category.name,
        )}" cannot be deleted because it is being used by existing transactions.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${formatCategoryName(category.name)}"?`,
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/categories/${category.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        let message = 'Failed to delete category.';
        try {
          const errorData = await response.json();
          if (typeof errorData.detail === 'string') {
            message = errorData.detail;
          }
        } catch {
          // Keep default error message.
        }
        throw new Error(message);
      }
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
    } catch (err) {
      console.error(err);
      window.alert(`Unable to delete category.\n\n${getApiError(err)}`);
    }
  }

  return {
    activeCategories: categories.filter((category) => category.active),
    categories,
    categoryError,
    categoryName,
    closeCategoryModal,
    error,
    formatCategoryName,
    handleCategorySubmit,
    handleDeleteCategory,
    loading,
    modalMode,
    openAddCategoryModal,
    openEditCategoryModal,
    savingCategory,
    setCategoryName,
    showCategoryModal,
    transactions,
  };
}
