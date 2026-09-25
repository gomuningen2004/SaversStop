import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  HandCoins,
  Plus,
  Receipt,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react';

import PeopleCard from '../components/PeopleCard';

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

type DebtType = 'owed_to_me' | 'i_owe';

type ModalMode = 'debt' | 'payment';

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

function People() {
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

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-500">Loading people...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">People</h1>

            <p className="mt-1 text-sm text-slate-500">
              Keep track of money you owe and money others owe you.
            </p>
          </div>

          <button
            onClick={openPersonModal}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus size={17} />
            Add Person
          </button>
        </div>

        {/* Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ArrowDownLeft size={18} />
              Total Receivable
            </div>

            <p className="mt-3 text-2xl font-semibold text-emerald-600">
              {formatAmount(summary.totalReceivable)}
            </p>

            <p className="mt-1 text-xs text-slate-500">Money others owe you</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ArrowUpRight size={18} />
              Total Payable
            </div>

            <p className="mt-3 text-2xl font-semibold text-red-600">
              {formatAmount(summary.totalPayable)}
            </p>

            <p className="mt-1 text-xs text-slate-500">Money you owe others</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <WalletCards size={18} />
              Net Position
            </div>

            <p
              className={`mt-3 text-2xl font-semibold ${
                summary.netPosition > 0
                  ? 'text-emerald-600'
                  : summary.netPosition < 0
                    ? 'text-red-600'
                    : 'text-slate-900'
              }`}
            >
              {formatAmount(summary.netPosition)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Receivable minus payable
            </p>
          </div>
        </div>

        {/* People */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">People</h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage outstanding balances and interactions.
            </p>
          </div>

          {activePeople.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <Users size={40} className="mx-auto text-slate-400" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No people yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Add someone whenever you lend money, borrow money, or need to
                keep track of an IOU.
              </p>

              <button
                onClick={openPersonModal}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus size={17} />
                Add Person
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sortedBalances.map(({ person, balance }) => (
                <PeopleCard
                  key={person.id}
                  person={person}
                  balance={balance}
                  saving={saving}
                  formatAmount={formatAmount}
                  onPayment={openPaymentModal}
                  onHistory={openHistory}
                  onAddDebt={openDebtModal}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Person Modal */}
      {showPersonModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Add Person</h2>

            <p className="mt-1 text-sm text-slate-500">
              Add someone you have an outstanding IOU with.
            </p>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Name
              </label>

              <input
                value={personName}
                onChange={(event) => setPersonName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !saving) {
                    addPerson();
                  }
                }}
                autoFocus
                placeholder="Rahul"
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closePersonModal}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={addPerson}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Person'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt / Payment Modal */}
      {showDebtModal && selectedPerson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedPerson.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {modalMode === 'payment'
                    ? 'Record a payment.'
                    : 'Add a new IOU.'}
                </p>
              </div>

              <button
                onClick={closeDebtModal}
                disabled={saving}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Current Balance */}
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Current balance</p>

              <p
                className={`mt-1 text-xl font-semibold ${
                  selectedPersonBalance > 0
                    ? 'text-emerald-600'
                    : selectedPersonBalance < 0
                      ? 'text-red-600'
                      : 'text-slate-900'
                }`}
              >
                {selectedBalanceLabel}
              </p>
            </div>

            {/* Add Debt */}
            {modalMode === 'debt' && (
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <Plus size={17} className="text-slate-700" />

                  <h3 className="text-sm font-semibold text-slate-900">
                    Add new IOU
                  </h3>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDebtType('owed_to_me')}
                    disabled={saving}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                      debtType === 'owed_to_me'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    They owe me
                  </button>

                  <button
                    onClick={() => setDebtType('i_owe')}
                    disabled={saving}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                      debtType === 'i_owe'
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    I owe them
                  </button>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={debtAmount}
                    onChange={(event) => setDebtAmount(event.target.value)}
                    placeholder="2500"
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Reason
                  </label>

                  <input
                    value={debtReason}
                    onChange={(event) => setDebtReason(event.target.value)}
                    placeholder="Dinner, borrowed money, etc."
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
                  />
                </div>

                <button
                  onClick={addDebt}
                  disabled={saving}
                  className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? 'Saving...' : 'Add IOU'}
                </button>
              </div>
            )}

            {/* Payment */}
            {modalMode === 'payment' && (
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <HandCoins size={17} className="text-slate-700" />

                  <h3 className="text-sm font-semibold text-slate-900">
                    Record payment
                  </h3>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedPersonBalance > 0
                    ? `${selectedPerson.name} is paying you.`
                    : `You are paying ${selectedPerson.name}.`}
                </p>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Payment amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={Math.abs(selectedPersonBalance)}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder={Math.abs(selectedPersonBalance).toString()}
                    disabled={saving}
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Maximum payment:{' '}
                  {formatAmount(Math.abs(selectedPersonBalance))}
                </p>

                <button
                  onClick={recordPayment}
                  disabled={saving}
                  className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            )}

            <button
              onClick={closeDebtModal}
              disabled={saving}
              className="mt-6 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedPerson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedPerson.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">IOU history</p>
                </div>

                <button
                  onClick={closeHistory}
                  aria-label="Close"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Current balance</p>

                <p
                  className={`mt-1 text-xl font-semibold ${
                    selectedPersonBalance > 0
                      ? 'text-emerald-600'
                      : selectedPersonBalance < 0
                        ? 'text-red-600'
                        : 'text-slate-900'
                  }`}
                >
                  {selectedBalanceLabel}
                </p>
              </div>
            </div>

            {/* History */}
            <div className="max-h-[55vh] overflow-y-auto p-6">
              {selectedPersonInteractions.length === 0 ? (
                <div className="py-10 text-center">
                  <Clock size={32} className="mx-auto text-slate-300" />

                  <p className="mt-3 text-sm text-slate-500">
                    No interactions yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPersonInteractions.map((interaction) => {
                    const increasesBalance =
                      interaction.type === 'owed_to_me' ||
                      interaction.type === 'payment_sent';

                    const isPayment =
                      interaction.type === 'payment_received' ||
                      interaction.type === 'payment_sent';

                    return (
                      <div
                        key={interaction.id}
                        className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`rounded-lg p-2 ${
                              isPayment
                                ? 'bg-slate-100'
                                : increasesBalance
                                  ? 'bg-emerald-50'
                                  : 'bg-red-50'
                            }`}
                          >
                            {isPayment ? (
                              <Receipt size={17} className="text-slate-600" />
                            ) : increasesBalance ? (
                              <ArrowDownLeft
                                size={17}
                                className="text-emerald-600"
                              />
                            ) : (
                              <ArrowUpRight
                                size={17}
                                className="text-red-600"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {interaction.reason || 'No reason provided'}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(interaction.interactionDate)}
                            </p>
                          </div>
                        </div>

                        <p
                          className={`shrink-0 text-sm font-semibold ${
                            increasesBalance
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          {increasesBalance ? '+' : '-'}
                          {formatAmount(interaction.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-6">
              <button
                onClick={closeHistory}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default People;
