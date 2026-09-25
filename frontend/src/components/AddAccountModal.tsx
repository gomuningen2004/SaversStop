import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import type {
  AccountClassification,
  AccountType,
  AccountTypesResponse,
} from '../types';

const API_URL = 'http://127.0.0.1:8000';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

function AddAccountModal({ isOpen, onClose, onSuccess }: AddAccountModalProps) {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);

  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [classification, setClassification] =
    useState<AccountClassification>('asset');
  const [balance, setBalance] = useState('');

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /*
   * LOAD ACCOUNT TYPES
   */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function loadAccountTypes() {
      setLoadingTypes(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/api/account-types`);

        if (!response.ok) {
          throw new Error('Failed to load account types.');
        }

        const data = (await response.json()) as AccountTypesResponse;

        const normalizedAccountTypes: AccountType[] = data.accountTypes.map(
          (accountType) => ({
            id: accountType.id,
            name: accountType.name,
            classification: accountType.classification,
            active: accountType.active,
          }),
        );

        const activeTypes = normalizedAccountTypes.filter(
          (accountType) => accountType.active,
        );

        setAccountTypes(activeTypes);

        if (activeTypes.length > 0) {
          setTypeId(activeTypes[0].id);
          setClassification(activeTypes[0].classification);
        }
      } catch (err) {
        console.error('Failed to load account types:', err);

        setError(
          err instanceof Error ? err.message : 'Unable to load account types.',
        );
      } finally {
        setLoadingTypes(false);
      }
    }

    loadAccountTypes();
  }, [isOpen]);

  /*
   * RESET FORM
   */

  const resetForm = () => {
    setName('');
    setBalance('');
    setError('');

    if (accountTypes.length > 0) {
      setTypeId(accountTypes[0].id);
      setClassification(accountTypes[0].classification);
    } else {
      setTypeId('');
      setClassification('asset');
    }
  };

  /*
   * CLOSE
   */

  const handleClose = () => {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  };

  /*
   * CLASSIFICATION CHANGE
   */

  const handleClassificationChange = (
    newClassification: AccountClassification,
  ) => {
    setClassification(newClassification);

    const compatibleType = accountTypes.find(
      (accountType) => accountType.classification === newClassification,
    );

    setTypeId(compatibleType?.id ?? '');
  };

  /*
   * ACCOUNT TYPE CHANGE
   */

  const handleTypeChange = (newTypeId: string) => {
    setTypeId(newTypeId);

    const selectedType = accountTypes.find(
      (accountType) => accountType.id === newTypeId,
    );

    if (selectedType) {
      setClassification(selectedType.classification);
    }
  };

  /*
   * SAVE
   */

  const handleSave = async () => {
    setError('');

    const trimmedName = name.trim();
    const numericBalance = Number(balance);

    if (!trimmedName) {
      setError('Please enter an account name.');
      return;
    }

    if (balance === '' || !Number.isFinite(numericBalance)) {
      setError('Please enter a valid balance.');
      return;
    }

    if (!typeId) {
      setError('Please select an account type.');
      return;
    }

    const selectedType = accountTypes.find(
      (accountType) => accountType.id === typeId,
    );

    if (!selectedType) {
      setError('Please select a valid account type.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          account_type_id: typeId,
          current_balance: Math.abs(numericBalance),
          active: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(errorData?.detail || 'Failed to create account.');
      }

      resetForm();

      await onSuccess();
    } catch (err) {
      console.error('Failed to create account:', err);

      setError(
        err instanceof Error ? err.message : 'Failed to create account.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const classificationTypes = accountTypes.filter(
    (accountType) => accountType.classification === classification,
  );

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* HEADER */}

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add Account
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add an account to your financial picture.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* FORM */}

        <div className="space-y-4">
          {/* NAME */}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Account Name
            </span>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. HDFC Bank"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              disabled={submitting}
            />
          </label>

          {/* CLASSIFICATION */}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Classification
            </span>

            <select
              value={classification}
              onChange={(event) =>
                handleClassificationChange(
                  event.target.value as AccountClassification,
                )
              }
              disabled={submitting || loadingTypes}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
            </select>
          </label>

          {/* ACCOUNT TYPE */}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Account Type
            </span>

            <select
              value={typeId}
              onChange={(event) => handleTypeChange(event.target.value)}
              disabled={
                submitting || loadingTypes || classificationTypes.length === 0
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {loadingTypes ? (
                <option value="">Loading account types...</option>
              ) : classificationTypes.length === 0 ? (
                <option value="">No account types available</option>
              ) : (
                classificationTypes.map((accountType) => (
                  <option key={accountType.id} value={accountType.id}>
                    {accountType.name}
                  </option>
                ))
              )}
            </select>
          </label>

          {/* BALANCE */}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Current Balance
            </span>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                ₹
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                placeholder="0.00"
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-8 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
          </label>
        </div>

        {/* ACTIONS */}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || loadingTypes}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Adding...' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddAccountModal;
