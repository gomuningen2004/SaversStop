import { useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound, X } from 'lucide-react';

type ChangeAppPinModalProps = {
  onClose: () => void;
  onSave: (currentPin: string, newPin: string) => Promise<boolean>;
};

function ChangeAppPinModal({ onClose, onSave }: ChangeAppPinModalProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) {
      setError('All PINs must contain six numbers.');
      return;
    }
    if (newPin !== confirmation) {
      setError('The new PINs do not match.');
      return;
    }

    setSaving(true);
    try {
      if (!(await onSave(currentPin, newPin))) {
        setError('The current PIN is incorrect.');
        setCurrentPin('');
        return;
      }
      onClose();
    } catch {
      setError('Unable to change the PIN in this browser.');
    } finally {
      setSaving(false);
    }
  };

  const updatePin = (value: string, setter: (value: string) => void) => {
    setter(value.replace(/\D/g, '').slice(0, 6));
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-110 flex items-center justify-center bg-slate-950/50 px-4 py-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-app-pin-title"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <KeyRound size={18} aria-hidden="true" />
            </div>
            <h2
              id="change-app-pin-title"
              className="text-lg font-semibold text-slate-900"
            >
              Change app PIN
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter your current PIN, then choose a new six-digit PIN.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close PIN settings"
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {[
            {
              id: 'current-app-pin',
              label: 'Current PIN',
              value: currentPin,
              update: setCurrentPin,
              autocomplete: 'current-password',
            },
            {
              id: 'new-app-pin',
              label: 'New PIN',
              value: newPin,
              update: setNewPin,
              autocomplete: 'new-password',
            },
            {
              id: 'confirm-app-pin',
              label: 'Confirm new PIN',
              value: confirmation,
              update: setConfirmation,
              autocomplete: 'new-password',
            },
          ].map((field) => (
            <div key={field.id}>
              <label
                htmlFor={field.id}
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                {field.label}
              </label>
              <input
                id={field.id}
                type="password"
                inputMode="numeric"
                autoComplete={field.autocomplete}
                value={field.value}
                onChange={(event) =>
                  updatePin(event.target.value, field.update)
                }
                maxLength={6}
                pattern="[0-9]{6}"
                required
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-lg tracking-[0.3em] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          ))}

          {error && (
            <p className="text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                currentPin.length !== 6 ||
                newPin.length !== 6 ||
                confirmation.length !== 6
              }
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save new PIN'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ChangeAppPinModal;
