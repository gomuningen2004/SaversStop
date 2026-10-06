
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';

import type { Account, Goal } from '../types';

import {
  analyzeGoal,
  formatGoalDate,
  formatGoalTargetDate,
} from '../utils/goals';

const API_URL = 'http://127.0.0.1:8000';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (amount: number) => currency.format(amount);

type AnalysisStatus =
  | 'completed'
  | 'on_track'
  | 'ahead'
  | 'behind'
  | 'not_feasible';

type RawGoal = {
  id: string;
  name: string;

  account_id: string;
  account_name: string | null;

  target_amount: number | string;
  saved_amount: number | string;
  monthly_contribution: number | string;

  target_date: string;

  status: 'active' | 'completed';
};

type RawGoalsResponse = {
  goals: RawGoal[];
};

type RawAccountsResponse = {
  accounts: Array<{
    id: string;
    name: string;
    account_type_id: string;
    current_balance: number | string;
    active: boolean;
  }>;
};

type GoalResponse = RawGoal;

const statusConfig: Record<
  AnalysisStatus,
  {
    label: string;
    className: string;
  }
> = {
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },

  ahead: {
    label: 'Ahead of schedule',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },

  on_track: {
    label: 'On track',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },

  behind: {
    label: 'Behind schedule',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },

  not_feasible: {
    label: 'Needs attention',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

const getStatusMessage = (
  status: AnalysisStatus,
  monthsEarly: number,
  monthsLate: number,
): string => {
  switch (status) {
    case 'completed':
      return '✓ Goal completed';

    case 'ahead':
      return `✓ At your current contribution rate, you'll reach this goal ${monthsEarly} month${
        monthsEarly === 1 ? '' : 's'
      } early.`;

    case 'on_track':
      return '✓ Your planned contribution is enough to reach this goal on time.';

    case 'behind':
      return `⚠️ Your current contribution may leave you about ${monthsLate} month${
        monthsLate === 1 ? '' : 's'
      } behind the target.`;

    case 'not_feasible':
      return '⚠️ Add a monthly contribution to make this goal achievable.';

    default:
      return '';
  }
};

function normalizeGoal(goal: RawGoal): Goal {
  return {
    id: goal.id,
    name: goal.name,
    accountId: goal.account_id,
    accountName: goal.account_name,
    targetAmount: Number(goal.target_amount),
    savedAmount: Number(goal.saved_amount),
    monthlyContribution: Number(goal.monthly_contribution),
    targetDate: goal.target_date,
    status: goal.status,
  };
}

function normalizeAccount(
  account: RawAccountsResponse['accounts'][number],
): Account {
  return {
    id: account.id,
    name: account.name,
    accountTypeId: account.account_type_id,
    currentBalance: Number(account.current_balance),
    active: account.active,
  };
}

export default function useGoalsPage() {
  /*
   * ---------------------------------------------------------
   * GOALS / ACCOUNTS
   * ---------------------------------------------------------
   */

  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * ---------------------------------------------------------
   * INLINE EDITING
   * ---------------------------------------------------------
   */

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [editGoalName, setEditGoalName] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editMonthlyContribution, setEditMonthlyContribution] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');

  const [editError, setEditError] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const handleEditGoalNameChange = (event: ChangeEvent<HTMLInputElement>) =>
    setEditGoalName(event.target.value);
  const handleEditAccountChange = (event: ChangeEvent<HTMLSelectElement>) =>
    setEditAccountId(event.target.value);
  const handleEditTargetAmountChange = (event: ChangeEvent<HTMLInputElement>) =>
    setEditTargetAmount(event.target.value);
  const handleEditMonthlyContributionChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => setEditMonthlyContribution(event.target.value);
  const handleEditTargetDateChange = (event: ChangeEvent<HTMLInputElement>) =>
    setEditTargetDate(event.target.value);

  /*
   * ---------------------------------------------------------
   * INLINE ADD
   * ---------------------------------------------------------
   */

  const [showAddGoal, setShowAddGoal] = useState(false);

  const [newGoalName, setNewGoalName] = useState('');
  const [newAccountId, setNewAccountId] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newMonthlyContribution, setNewMonthlyContribution] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');

  const [addGoalError, setAddGoalError] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);

  /*
   * ---------------------------------------------------------
   * DELETE
   * ---------------------------------------------------------
   */

  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * CONTRIBUTION
   * ---------------------------------------------------------
   */

  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);

  const [contributionAmount, setContributionAmount] = useState('');

  const [contributionSaving, setContributionSaving] = useState(false);

  /*
   * ---------------------------------------------------------
   * LOAD GOALS + ACCOUNTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [goalsResponse, accountsResponse] = await Promise.all([
          fetch(`${API_URL}/api/goals`),
          fetch(`${API_URL}/api/accounts`),
        ]);

        if (!goalsResponse.ok) {
          throw new Error(`Goals request failed: ${goalsResponse.status}`);
        }

        if (!accountsResponse.ok) {
          throw new Error(
            `Accounts request failed: ${accountsResponse.status}`,
          );
        }

        const goalsData = (await goalsResponse.json()) as RawGoalsResponse;

        const accountsData =
          (await accountsResponse.json()) as RawAccountsResponse;

        const normalizedGoals = (goalsData.goals ?? []).map(normalizeGoal);

        const normalizedAccounts = (accountsData.accounts ?? [])
          .filter((account) => account.active)
          .map(normalizeAccount);

        setGoals(normalizedGoals);
        setAccounts(normalizedAccounts);
      } catch (loadError) {
        console.error('Failed to load goals/accounts:', loadError);

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load goals.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * ---------------------------------------------------------
   * ANALYZE EVERY GOAL
   * ---------------------------------------------------------
   */

  const analyses = useMemo(() => {
    return goals.map((goal) => ({
      goal,
      analysis: analyzeGoal(
        goal.targetAmount,
        goal.savedAmount,
        goal.monthlyContribution,
        goal.targetDate,
      ),
    }));
  }, [goals]);

  /*
   * ---------------------------------------------------------
   * TOTAL TARGET
   * ---------------------------------------------------------
   */

  const totalTarget = useMemo(
    () => goals.reduce((total, goal) => total + goal.targetAmount, 0),
    [goals],
  );

  /*
   * ---------------------------------------------------------
   * TOTAL SAVED
   * ---------------------------------------------------------
   */

  const totalSaved = useMemo(
    () => goals.reduce((total, goal) => total + goal.savedAmount, 0),
    [goals],
  );

  /*
   * ---------------------------------------------------------
   * ACTIVE GOALS
   * ---------------------------------------------------------
   */

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'active'),
    [goals],
  );

  /*
   * ---------------------------------------------------------
   * COMPLETED GOALS
   * ---------------------------------------------------------
   */

  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'completed'),
    [goals],
  );

  /*
   * ---------------------------------------------------------
   * ADD GOAL
   * ---------------------------------------------------------
   */

  const openAddGoal = () => {
    setShowAddGoal(true);

    setNewGoalName('');
    setNewAccountId(accounts[0]?.id ?? '');
    setNewTargetAmount('');
    setNewMonthlyContribution('');
    setNewTargetDate('');

    setAddGoalError('');
  };

  const closeAddGoal = () => {
    if (addingGoal) {
      return;
    }

    setShowAddGoal(false);

    setNewGoalName('');
    setNewAccountId('');
    setNewTargetAmount('');
    setNewMonthlyContribution('');
    setNewTargetDate('');

    setAddGoalError('');
  };

  const addGoal = async () => {
    setAddGoalError('');

    const trimmedName = newGoalName.trim();

    const numericTargetAmount = Number(newTargetAmount);

    const numericMonthlyContribution = Number(newMonthlyContribution);

    if (!trimmedName) {
      setAddGoalError('Please enter a goal name.');
      return;
    }

    if (!newAccountId) {
      setAddGoalError('Please select an account.');
      return;
    }

    if (!Number.isFinite(numericTargetAmount) || numericTargetAmount <= 0) {
      setAddGoalError('Please enter a valid target amount.');
      return;
    }

    if (
      !Number.isFinite(numericMonthlyContribution) ||
      numericMonthlyContribution <= 0
    ) {
      setAddGoalError('Please enter a valid monthly contribution.');
      return;
    }

    if (numericMonthlyContribution > numericTargetAmount) {
      setAddGoalError(
        'Monthly contribution cannot be greater than the target amount.',
      );
      return;
    }

    if (!newTargetDate) {
      setAddGoalError('Please select a target date.');
      return;
    }

    const selectedDate = new Date(`${newTargetDate}T00:00:00`);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setAddGoalError('Target date must be today or a future date.');
      return;
    }

    try {
      setAddingGoal(true);

      const response = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          name: trimmedName,
          account_id: newAccountId,
          target_amount: numericTargetAmount,
          saved_amount: 0,
          monthly_contribution: numericMonthlyContribution,
          target_date: newTargetDate,
          status: 'active',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.detail ?? 'Failed to create goal.');
      }

      const createdGoal = normalizeGoal(responseData as RawGoal);

      setGoals((currentGoals) => [...currentGoals, createdGoal]);

      closeAddGoal();
    } catch (addError) {
      console.error('Failed to create goal:', addError);

      setAddGoalError(
        addError instanceof Error ? addError.message : 'Failed to create goal.',
      );
    } finally {
      setAddingGoal(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * START INLINE EDIT
   * ---------------------------------------------------------
   */

  const startEditingGoal = (goal: Goal) => {
    setShowAddGoal(false);

    setEditingGoalId(goal.id);

    setEditGoalName(goal.name);
    setEditAccountId(goal.accountId);
    setEditTargetAmount(String(goal.targetAmount));
    setEditMonthlyContribution(String(goal.monthlyContribution));
    setEditTargetDate(goal.targetDate);

    setEditError('');
  };

  /*
   * ---------------------------------------------------------
   * CANCEL INLINE EDIT
   * ---------------------------------------------------------
   */

  const cancelEditingGoal = () => {
    if (savingGoal) {
      return;
    }

    setEditingGoalId(null);

    setEditGoalName('');
    setEditAccountId('');
    setEditTargetAmount('');
    setEditMonthlyContribution('');
    setEditTargetDate('');

    setEditError('');
  };

  /*
   * ---------------------------------------------------------
   * SAVE INLINE EDIT
   * ---------------------------------------------------------
   */

  const saveEditedGoal = async (goal: Goal) => {
    setEditError('');

    const trimmedName = editGoalName.trim();

    const numericTargetAmount = Number(editTargetAmount);

    const numericMonthlyContribution = Number(editMonthlyContribution);

    if (!trimmedName) {
      setEditError('Please enter a goal name.');
      return;
    }

    if (!editAccountId) {
      setEditError('Please select an account.');
      return;
    }

    if (!Number.isFinite(numericTargetAmount) || numericTargetAmount <= 0) {
      setEditError('Please enter a valid target amount.');
      return;
    }

    if (
      !Number.isFinite(numericMonthlyContribution) ||
      numericMonthlyContribution <= 0
    ) {
      setEditError('Please enter a valid monthly contribution.');
      return;
    }

    if (numericMonthlyContribution > numericTargetAmount) {
      setEditError(
        'Monthly contribution cannot be greater than the target amount.',
      );
      return;
    }

    if (!editTargetDate) {
      setEditError('Please select a target date.');
      return;
    }

    const selectedDate = new Date(`${editTargetDate}T00:00:00`);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setEditError('Target date must be today or a future date.');
      return;
    }

    /*
     * Preserve saved amount.
     */

    const savedAmount = Math.min(goal.savedAmount, numericTargetAmount);

    try {
      setSavingGoal(true);

      const response = await fetch(`${API_URL}/api/goals/${goal.id}`, {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          name: trimmedName,

          account_id: editAccountId,

          target_amount: numericTargetAmount,

          saved_amount: savedAmount,

          monthly_contribution: numericMonthlyContribution,

          target_date: editTargetDate,

          status: savedAmount >= numericTargetAmount ? 'completed' : 'active',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.detail ?? 'Failed to update goal.');
      }

      const updatedGoal = normalizeGoal(responseData as GoalResponse);

      setGoals((currentGoals) =>
        currentGoals.map((currentGoal) =>
          currentGoal.id === updatedGoal.id ? updatedGoal : currentGoal,
        ),
      );

      cancelEditingGoal();
    } catch (updateError) {
      console.error('Failed to update goal:', updateError);

      setEditError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update goal.',
      );
    } finally {
      setSavingGoal(false);
    }
  };

  const getSaveEditedGoalHandler = (goal: Goal) => () =>
    saveEditedGoal(goal);

  /*
   * ---------------------------------------------------------
   * DELETE GOAL
   * ---------------------------------------------------------
   */

  const deleteGoal = async (goal: Goal) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${goal.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setDeletingGoalId(goal.id);

      const response = await fetch(`${API_URL}/api/goals/${goal.id}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.detail ?? 'Failed to delete goal.');
      }

      setGoals((currentGoals) =>
        currentGoals.filter((currentGoal) => currentGoal.id !== goal.id),
      );

      if (editingGoalId === goal.id) {
        cancelEditingGoal();
      }
    } catch (deleteError) {
      console.error('Failed to delete goal:', deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete goal.',
      );
    } finally {
      setDeletingGoalId(null);
    }
  };

  const getStartEditingGoalHandler = (goal: Goal) => () =>
    startEditingGoal(goal);
  const getDeleteGoalHandler = (goal: Goal) => () => deleteGoal(goal);

  /*
   * ---------------------------------------------------------
   * CONTRIBUTION
   * ---------------------------------------------------------
   */

  const openContributionModal = (goal: Goal) => {
    const defaultAmount =
      goal.monthlyContribution > 0 ? goal.monthlyContribution : '';

    setContributionAmount(defaultAmount.toString());

    setContributionGoal(goal);
  };

  const getOpenContributionModalHandler = (goal: Goal) => () =>
    openContributionModal(goal);

  const closeContributionModal = () => {
    if (contributionSaving) {
      return;
    }

    setContributionGoal(null);
    setContributionAmount('');
  };

  const addContribution = async () => {
    if (!contributionGoal) {
      return;
    }

    const amount = Number(contributionAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Contribution amount must be greater than zero.');
      return;
    }

    try {
      setContributionSaving(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/goals/${contributionGoal.id}/contribute`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            amount,
          }),
        },
      );

      const responseData = (await response.json()) as
        | GoalResponse
        | { detail?: string };

      if (!response.ok) {
        throw new Error(
          'detail' in responseData && responseData.detail
            ? responseData.detail
            : 'Failed to add contribution.',
        );
      }

      const updatedGoal = normalizeGoal(responseData as GoalResponse);

      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === updatedGoal.id ? updatedGoal : goal,
        ),
      );

      setContributionGoal(null);
      setContributionAmount('');
    } catch (contributionError) {
      console.error('Failed to add contribution:', contributionError);

      setError(
        contributionError instanceof Error
          ? contributionError.message
          : 'Failed to add contribution.',
      );
    } finally {
      setContributionSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

    return {
    formatAmount,
    getStatusMessage,
    formatGoalDate,
    formatGoalTargetDate,
    statusConfig,
    handleEditGoalNameChange,
    handleEditAccountChange,
    handleEditTargetAmountChange,
    handleEditMonthlyContributionChange,
    handleEditTargetDateChange,
    goals,
    accounts,
    loading,
    error,
    editingGoalId,
    editGoalName,
    editAccountId,
    editTargetAmount,
    editMonthlyContribution,
    editTargetDate,
    editError,
    savingGoal,
    showAddGoal,
    newGoalName,
    setNewGoalName,
    newAccountId,
    setNewAccountId,
    newTargetAmount,
    setNewTargetAmount,
    newMonthlyContribution,
    setNewMonthlyContribution,
    newTargetDate,
    setNewTargetDate,
    addGoalError,
    addingGoal,
    deletingGoalId,
    contributionGoal,
    contributionAmount,
    setContributionAmount,
    contributionSaving,
    analyses,
    totalTarget,
    totalSaved,
    activeGoals,
    completedGoals,
    openAddGoal,
    closeAddGoal,
    addGoal,
    cancelEditingGoal,
    getSaveEditedGoalHandler,
    getStartEditingGoalHandler,
    getDeleteGoalHandler,
    getOpenContributionModalHandler,
    closeContributionModal,
    addContribution,
  };
}
