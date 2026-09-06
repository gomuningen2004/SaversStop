import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Clock,
  HandCoins,
  Plus,
  Receipt,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react';

import type { DebtInteraction, Person } from '../types';

import {
  calculatePeopleBalances,
  calculatePeopleSummary,
  getBalanceAmount,
  getBalanceLabel,
} from '../utils/people';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (amount: number) => currency.format(amount);

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function People() {
  const [people, setPeople] = useState<Person[]>([]);
  const [interactions, setInteractions] = useState<DebtInteraction[]>([]);

  const [loading, setLoading] = useState(true);

  const [showPersonModal, setShowPersonModal] = useState(false);

  const [showDebtModal, setShowDebtModal] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [personName, setPersonName] = useState('');

  const [debtType, setDebtType] = useState<'owed_to_me' | 'i_owe'>(
    'owed_to_me',
  );

  const [debtAmount, setDebtAmount] = useState('');

  const [debtReason, setDebtReason] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [peopleResponse, interactionsResponse] = await Promise.all([
          fetch('/data/people.json'),
          fetch('/data/debtInteractions.json'),
        ]);

        if (!peopleResponse.ok) {
          throw new Error('Failed to load people');
        }

        if (!interactionsResponse.ok) {
          throw new Error('Failed to load debt interactions');
        }

        const peopleData = await peopleResponse.json();

        const interactionData = await interactionsResponse.json();

        setPeople(peopleData.people ?? []);

        setInteractions(interactionData.interactions ?? []);
      } catch (error) {
        console.error('Failed to load People data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const balances = useMemo(
    () => calculatePeopleBalances(people, interactions),
    [people, interactions],
  );

  const summary = useMemo(() => calculatePeopleSummary(balances), [balances]);

  const receivables = balances.filter(({ balance }) => balance > 0);

  const payables = balances.filter(({ balance }) => balance < 0);

  const settledPeople = balances.filter(({ balance }) => balance === 0);

  const selectedPersonBalance = selectedPerson
    ? (balances.find(({ person }) => person.id === selectedPerson.id)
        ?.balance ?? 0)
    : 0;

  const selectedPersonInteractions = selectedPerson
    ? interactions
        .filter((interaction) => interaction.personId === selectedPerson.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const closePersonModal = () => {
    setShowPersonModal(false);
    setPersonName('');
  };

  const addPerson = () => {
    const trimmedName = personName.trim();

    if (!trimmedName) {
      return;
    }

    const duplicate = people.some(
      (person) => person.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (duplicate) {
      alert('A person with this name already exists.');
      return;
    }

    const nextId =
      people.length > 0
        ? Math.max(...people.map((person) => person.id)) + 1
        : 1;

    const newPerson: Person = {
      id: nextId,
      name: trimmedName,
    };

    setPeople((current) => [...current, newPerson]);

    closePersonModal();

    setSelectedPerson(newPerson);
    setShowDebtModal(true);
  };

  const openDebtModal = (person: Person) => {
    setSelectedPerson(person);
    setDebtType('owed_to_me');
    setDebtAmount('');
    setDebtReason('');
    setPaymentAmount('');
    setShowDebtModal(true);
  };

  const closeDebtModal = () => {
    setShowDebtModal(false);
    setDebtAmount('');
    setDebtReason('');
    setPaymentAmount('');
  };

  const addDebt = () => {
    if (!selectedPerson) {
      return;
    }

    const amount = Number(debtAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    if (!debtReason.trim()) {
      return;
    }

    const nextId =
      interactions.length > 0
        ? Math.max(...interactions.map((interaction) => interaction.id)) + 1
        : 1;

    const interaction: DebtInteraction = {
      id: nextId,
      personId: selectedPerson.id,
      date: new Date().toISOString().split('T')[0],
      amount,
      type: debtType,
      reason: debtReason.trim(),
    };

    setInteractions((current) => [...current, interaction]);

    closeDebtModal();
  };

  const recordPayment = () => {
    if (!selectedPerson) {
      return;
    }

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    if (selectedPersonBalance === 0) {
      return;
    }

    if (amount > Math.abs(selectedPersonBalance)) {
      alert('Payment cannot be greater than the outstanding balance.');
      return;
    }

    const paymentType =
      selectedPersonBalance > 0 ? 'payment_received' : 'payment_sent';

    const nextId =
      interactions.length > 0
        ? Math.max(...interactions.map((interaction) => interaction.id)) + 1
        : 1;

    const interaction: DebtInteraction = {
      id: nextId,
      personId: selectedPerson.id,
      date: new Date().toISOString().split('T')[0],
      amount,
      type: paymentType,
      reason: selectedPersonBalance > 0 ? 'Payment received' : 'Payment sent',
    };

    setInteractions((current) => [...current, interaction]);

    setPaymentAmount('');
  };

  const openHistory = (person: Person) => {
    setSelectedPerson(person);
    setShowHistoryModal(true);
  };

  const closeHistory = () => {
    setShowHistoryModal(false);
  };

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
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">People</h1>

            <p className="mt-1 text-sm text-slate-500">
              Keep track of who owes you and who you owe.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowPersonModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserPlus size={17} />
              Add Person
            </button>

            <button
              onClick={() => {
                if (people.length === 0) {
                  setShowPersonModal(true);
                  return;
                }

                setSelectedPerson(people[0]);

                setShowDebtModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Add Debt
            </button>
          </div>
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

        {/* Settlement suggestion */}
        {(summary.totalReceivable > 0 || summary.totalPayable > 0) && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <HandCoins size={20} className="text-slate-700" />
              </div>

              <div className="flex-1">
                <h2 className="font-semibold text-slate-900">
                  Settlement overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  You have{' '}
                  <span className="font-medium text-emerald-600">
                    {formatAmount(summary.totalReceivable)}
                  </span>{' '}
                  receivable and{' '}
                  <span className="font-medium text-red-600">
                    {formatAmount(summary.totalPayable)}
                  </span>{' '}
                  payable.
                </p>

                {summary.potentialSettlement > 0 && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-800">
                      Potential settlement amount
                    </p>

                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {formatAmount(summary.potentialSettlement)}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This is the amount that could theoretically offset your
                      outstanding receivables and payables. It does not move
                      money or automatically settle anyone.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Receivables */}
        {receivables.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  People who owe you
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Money you expect to receive.
                </p>
              </div>

              <span className="text-sm font-medium text-emerald-600">
                {formatAmount(summary.totalReceivable)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {receivables.map(({ person, balance }) => (
                <div
                  key={person.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
                        {person.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h3 className="font-medium text-slate-900">
                          {person.name}
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Owes you
                        </p>
                      </div>
                    </div>

                    <p className="text-lg font-semibold text-emerald-600">
                      {formatAmount(balance)}
                    </p>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => openDebtModal(person)}
                      className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Record Payment
                    </button>

                    <button
                      onClick={() => openHistory(person)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
                      title="View history"
                    >
                      <Receipt size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Payables */}
        {payables.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  People you owe
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Money you need to pay.
                </p>
              </div>

              <span className="text-sm font-medium text-red-600">
                {formatAmount(summary.totalPayable)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {payables.map(({ person, balance }) => (
                <div
                  key={person.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-sm font-semibold text-red-700">
                        {person.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h3 className="font-medium text-slate-900">
                          {person.name}
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-500">You owe</p>
                      </div>
                    </div>

                    <p className="text-lg font-semibold text-red-600">
                      {formatAmount(Math.abs(balance))}
                    </p>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => openDebtModal(person)}
                      className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Record Payment
                    </button>

                    <button
                      onClick={() => openHistory(person)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
                      title="View history"
                    >
                      <Receipt size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Settled */}
        {settledPeople.length > 0 && (
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Settled</h2>

              <p className="mt-1 text-sm text-slate-500">
                No outstanding balance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {settledPeople.map(({ person }) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {person.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {person.name}
                      </p>

                      <p className="text-xs text-slate-500">Settled</p>
                    </div>
                  </div>

                  <Check size={18} className="text-emerald-600" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {people.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Users size={40} className="mx-auto text-slate-400" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No people yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Add someone whenever you lend money, borrow money, or need to keep
              track of an IOU.
            </p>

            <button
              onClick={() => setShowPersonModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              <UserPlus size={17} />
              Add Person
            </button>
          </div>
        )}
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
                  if (event.key === 'Enter') {
                    addPerson();
                  }
                }}
                autoFocus
                placeholder="Rahul"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closePersonModal}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={addPerson}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add Person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt / Payment Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedPerson ? `Manage ${selectedPerson.name}` : 'Add Debt'}
            </h2>

            {selectedPerson && (
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
                  {selectedPersonBalance === 0
                    ? 'Settled'
                    : `${getBalanceLabel(selectedPersonBalance)} ${formatAmount(
                        getBalanceAmount(selectedPersonBalance),
                      )}`}
                </p>
              </div>
            )}

            {/* New debt */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Add new IOU
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDebtType('owed_to_me')}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                    debtType === 'owed_to_me'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  They owe me
                </button>

                <button
                  onClick={() => setDebtType('i_owe')}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                    debtType === 'i_owe'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  I owe them
                </button>
              </div>

              {!selectedPerson && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Person
                  </label>

                  <select
                    value={selectedPerson?.id ?? ''}
                    onChange={(event) => {
                      const person = people.find(
                        (item) => item.id === Number(event.target.value),
                      );

                      setSelectedPerson(person ?? null);
                    }}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
                  >
                    <option value="">Select person</option>

                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
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
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <button
                onClick={addDebt}
                disabled={!selectedPerson}
                className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add IOU
              </button>
            </div>

            {/* Payment */}
            {selectedPerson && selectedPersonBalance !== 0 && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Record payment
                </h3>

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
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <button
                  onClick={recordPayment}
                  className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Record Payment
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDebtModal}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedPerson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
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
                  {selectedPersonBalance === 0
                    ? 'Settled'
                    : `${getBalanceLabel(selectedPersonBalance)} ${formatAmount(
                        getBalanceAmount(selectedPersonBalance),
                      )}`}
                </p>
              </div>
            </div>

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
                    const isPositive =
                      interaction.type === 'owed_to_me' ||
                      interaction.type === 'payment_sent';

                    const isPayment =
                      interaction.type === 'payment_received' ||
                      interaction.type === 'payment_sent';

                    return (
                      <div
                        key={interaction.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-lg p-2 ${
                              isPayment
                                ? 'bg-slate-100'
                                : isPositive
                                  ? 'bg-emerald-50'
                                  : 'bg-red-50'
                            }`}
                          >
                            {isPayment ? (
                              <Receipt size={17} className="text-slate-600" />
                            ) : isPositive ? (
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

                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {interaction.reason}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(interaction.date)}
                            </p>
                          </div>
                        </div>

                        <p
                          className={`text-sm font-semibold ${
                            isPayment
                              ? 'text-slate-700'
                              : isPositive
                                ? 'text-emerald-600'
                                : 'text-red-600'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {formatAmount(interaction.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
