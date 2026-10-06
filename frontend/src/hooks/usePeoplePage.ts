
import { useEffect, useMemo, useState } from 'react';

import type { DebtType, ModalMode } from '../components/people/DebtPaymentModal';

import type { DebtInteraction, Person } from '../types';

import {
  calculatePeopleBalances,
  calculatePeopleSummary,
  getBalanceAmount,
  getBalanceLabel,
} from '../utils/people';

const API_URL = 'http://127.0.0.1:8000';

type RawPerson = {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
};

type RawPeopleResponse = {
  people: RawPerson[];
};

type RawDebtInteraction = {
  id: string;
  person_id: string;
  interaction_date: string;
  amount: number | string;
  type: 'owed_to_me' | 'payment_received' | 'i_owe' | 'payment_sent';
  reason?: string | null;
};

type RawDebtInteractionsResponse = {
  interactions: RawDebtInteraction[];
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (amount: number) => currency.format(amount);

const formatDate = (date: string) => {
  if (!date) {
    return '-';
  }

  const normalizedDate = `${date.slice(0, 10)}T00:00:00`;

  return new Date(normalizedDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const normalizePerson = (person: RawPerson): Person => ({
  id: person.id,
  name: person.name,
  active: person.active,
  createdAt: person.created_at,
});

const normalizeInteraction = (
  interaction: RawDebtInteraction,
): DebtInteraction => ({
  id: interaction.id,
  personId: interaction.person_id,
  interactionDate: interaction.interaction_date,
  amount: Number(interaction.amount),
  type: interaction.type,
  reason: interaction.reason ?? '',
});

async function getApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();

    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    if (typeof data?.message === 'string') {
      return data.message;
    }
  } catch {
    // Ignore invalid/non-JSON response bodies.
  }

  return fallback;
}

export default function usePeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [interactions, setInteractions] = useState<DebtInteraction[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>('debt');

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [personName, setPersonName] = useState('');

  const [debtType, setDebtType] = useState<DebtType>('owed_to_me');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtReason, setDebtReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  /*
   * Load people and debt interactions from FastAPI.
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [peopleResponse, interactionsResponse] = await Promise.all([
          fetch(`${API_URL}/api/people`),
          fetch(`${API_URL}/api/debt-interactions`),
        ]);

        if (!peopleResponse.ok) {
          throw new Error(
            await getApiError(
              peopleResponse,
              `Failed to load people (${peopleResponse.status})`,
            ),
          );
        }

        if (!interactionsResponse.ok) {
          throw new Error(
            await getApiError(
              interactionsResponse,
              `Failed to load debt interactions (${interactionsResponse.status})`,
            ),
          );
        }

        const peopleData = (await peopleResponse.json()) as RawPeopleResponse;

        const interactionData =
          (await interactionsResponse.json()) as RawDebtInteractionsResponse;

        setPeople((peopleData.people ?? []).map(normalizePerson));

        setInteractions(
          (interactionData.interactions ?? []).map(normalizeInteraction),
        );
      } catch (error) {
        console.error('Failed to load People data:', error);

        alert(
          error instanceof Error
            ? error.message
            : 'Failed to load People data.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * Only active people participate in the current People view.
   */
  const activePeople = useMemo(
    () => people.filter((person) => person.active),
    [people],
  );

  const balances = useMemo(() => {
    const calculatedBalances = calculatePeopleBalances(
      activePeople,
      interactions,
    );

    return [...calculatedBalances].sort((a, b) => {
      const aSettled = a.balance === 0;
      const bSettled = b.balance === 0;

      // Settled people always come after people with outstanding balances.
      if (aSettled && !bSettled) {
        return 1;
      }

      if (!aSettled && bSettled) {
        return -1;
      }

      // Both are settled: sort only by name.
      if (aSettled && bSettled) {
        return a.person.name.localeCompare(b.person.name);
      }

      // Both have outstanding balances:
      // largest absolute amount first.
      const amountDifference = Math.abs(b.balance) - Math.abs(a.balance);

      if (amountDifference !== 0) {
        return amountDifference;
      }

      // Same amount: oldest person first.
      const dateDifference =
        new Date(a.person.createdAt).getTime() -
        new Date(b.person.createdAt).getTime();

      if (dateDifference !== 0) {
        return dateDifference;
      }

      // Same amount and same creation date: alphabetical.
      return a.person.name.localeCompare(b.person.name);
    });
  }, [activePeople, interactions]);

  const sortedBalances = useMemo(() => {
    return [...balances].sort((a, b) => {
      const aSettled = a.balance === 0;
      const bSettled = b.balance === 0;

      // Both settled → name only
      if (aSettled && bSettled) {
        return a.person.name.localeCompare(b.person.name);
      }

      // Settled people go after people with outstanding balances
      if (aSettled) {
        return 1;
      }

      if (bSettled) {
        return -1;
      }

      // Both have outstanding balances.
      // Largest absolute amount first.
      const amountDifference = Math.abs(b.balance) - Math.abs(a.balance);

      if (amountDifference !== 0) {
        return amountDifference;
      }

      // Same amount → newest created person first.
      const createdDateDifference =
        new Date(b.person.createdAt).getTime() -
        new Date(a.person.createdAt).getTime();

      if (createdDateDifference !== 0) {
        return createdDateDifference;
      }

      // Still tied → name A-Z.
      return a.person.name.localeCompare(b.person.name);
    });
  }, [balances]);

  const summary = useMemo(() => calculatePeopleSummary(balances), [balances]);

  /*
   * Get balance for a specific person.
   */
  const getPersonBalance = (person: Person) =>
    balances.find(({ person: balancePerson }) => balancePerson.id === person.id)
      ?.balance ?? 0;

  /*
   * Reset debt/payment form fields.
   */
  const resetDebtForm = () => {
    setDebtType('owed_to_me');
    setDebtAmount('');
    setDebtReason('');
    setPaymentAmount('');
  };

  /*
   * Open Add Debt modal.
   */
  const openDebtModal = (person: Person) => {
    setSelectedPerson(person);
    setModalMode('debt');
    resetDebtForm();
    setShowDebtModal(true);
  };

  /*
   * Open Payment modal.
   */
  const openPaymentModal = (person: Person) => {
    setSelectedPerson(person);
    setModalMode('payment');
    setPaymentAmount('');
    setShowDebtModal(true);
  };

  /*
   * Close Debt / Payment modal.
   */
  const closeDebtModal = () => {
    if (saving) {
      return;
    }

    setShowDebtModal(false);
    setSelectedPerson(null);
    resetDebtForm();
  };

  /*
   * Open Add Person modal.
   */
  const openPersonModal = () => {
    setPersonName('');
    setShowPersonModal(true);
  };

  /*
   * Close Add Person modal.
   */
  const closePersonModal = () => {
    if (saving) {
      return;
    }

    setShowPersonModal(false);
    setPersonName('');
  };

  /*
   * Add person through FastAPI.
   */
  const addPerson = async () => {
    const trimmedName = personName.trim();

    if (!trimmedName) {
      alert('Please enter a name.');
      return;
    }

    const duplicate = people.some(
      (person) => person.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (duplicate) {
      alert('A person with this name already exists.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/api/people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          active: true,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response, 'Failed to add person.'));
      }

      const data = (await response.json()) as RawPerson;
      const newPerson = normalizePerson(data);

      setPeople((current) => [...current, newPerson]);

      setShowPersonModal(false);
      setPersonName('');

      /*
       * Open Add Debt for the newly created person.
       */
      setSelectedPerson(newPerson);
      setModalMode('debt');
      resetDebtForm();
      setShowDebtModal(true);
    } catch (error) {
      console.error('Failed to add person:', error);

      alert(error instanceof Error ? error.message : 'Failed to add person.');
    } finally {
      setSaving(false);
    }
  };

  /*
   * Add a new IOU through FastAPI.
   */
  const addDebt = async () => {
    if (!selectedPerson) {
      return;
    }

    const amount = Number(debtAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const trimmedReason = debtReason.trim();

    if (!trimmedReason) {
      alert('Please enter a reason.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/api/debt-interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person_id: selectedPerson.id,
          interaction_date: `${new Date().toISOString().slice(0, 10)}T00:00:00`,
          amount,
          type: debtType,
          reason: trimmedReason,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response, 'Failed to add IOU.'));
      }

      const data = await response.json();

      const newInteraction = normalizeInteraction(data.interaction);

      setInteractions((current) => [...current, newInteraction]);

      closeDebtModal();
    } catch (error) {
      console.error('Failed to add debt interaction:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to add debt interaction.',
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Record payment through FastAPI.
   */
  const recordPayment = async () => {
    if (!selectedPerson) {
      return;
    }

    const balance = getPersonBalance(selectedPerson);
    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    if (balance === 0) {
      alert('There is no outstanding balance for this person.');
      return;
    }

    if (amount > Math.abs(balance)) {
      alert('Payment cannot be greater than the outstanding balance.');
      return;
    }

    const paymentType = balance > 0 ? 'payment_received' : 'payment_sent';

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/api/debt-interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person_id: selectedPerson.id,
          interaction_date: `${new Date().toISOString().slice(0, 10)}T00:00:00`,
          amount,
          type: paymentType,
          reason: balance > 0 ? 'Payment received' : 'Payment sent',
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiError(response, 'Failed to record payment.'),
        );
      }

      const data = await response.json();

      const newInteraction = normalizeInteraction(data.interaction);

      setInteractions((current) => [...current, newInteraction]);
      setPaymentAmount('');
    } catch (error) {
      console.error('Failed to record payment:', error);

      alert(
        error instanceof Error ? error.message : 'Failed to record payment.',
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Open History modal.
   */
  const openHistory = (person: Person) => {
    setSelectedPerson(person);
    setShowHistoryModal(true);
  };

  /*
   * Close History modal.
   */
  const closeHistory = () => {
    setShowHistoryModal(false);
    setSelectedPerson(null);
  };

  /*
   * Interactions for selected person, newest first.
   */
  const selectedPersonInteractions = useMemo(() => {
    if (!selectedPerson) {
      return [];
    }

    return interactions
      .filter((interaction) => interaction.personId === selectedPerson.id)
      .sort(
        (a, b) =>
          new Date(b.interactionDate).getTime() -
          new Date(a.interactionDate).getTime(),
      );
  }, [interactions, selectedPerson]);

  const selectedPersonBalance = selectedPerson
    ? getPersonBalance(selectedPerson)
    : 0;

  const selectedBalanceLabel =
    selectedPersonBalance === 0
      ? 'Settled'
      : `${getBalanceLabel(selectedPersonBalance)} ${formatAmount(
          getBalanceAmount(selectedPersonBalance),
        )}`;

  return {
    formatAmount,
    formatDate,
    loading,
    saving,
    showPersonModal,
    showDebtModal,
    showHistoryModal,
    modalMode,
    selectedPerson,
    personName,
    setPersonName,
    debtType,
    setDebtType,
    debtAmount,
    setDebtAmount,
    debtReason,
    setDebtReason,
    paymentAmount,
    setPaymentAmount,
    activePeople,
    sortedBalances,
    summary,
    openDebtModal,
    openPaymentModal,
    closeDebtModal,
    openPersonModal,
    closePersonModal,
    addPerson,
    addDebt,
    recordPayment,
    openHistory,
    closeHistory,
    selectedPersonInteractions,
    selectedPersonBalance,
    selectedBalanceLabel,
  };
}
