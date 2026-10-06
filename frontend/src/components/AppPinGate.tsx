import { useState } from 'react';
import type { FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';

type AppPinGateProps = {
  hasPin: boolean;
  onCreatePin: (pin: string) => Promise<boolean>;
  onUnlock: (pin: string) => Promise<boolean>;
};

function AppPinGate({ hasPin, onCreatePin, onUnlock }: AppPinGateProps) {
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(pin)) {
      setError('Enter a six-digit PIN.');
      return;
    }

    if (!hasPin && pin !== confirmation) {
      setError('The PINs do not match.');
      return;
    }

    setWorking(true);
    try {
      const accepted = hasPin ? await onUnlock(pin) : await onCreatePin(pin);
      if (!accepted) {
        setError('That PIN is incorrect. Try again.');
        setPin('');
      }
    } catch {
      setError('PIN security is unavailable in this browser.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="fixed inset-0 z-100 flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
      <section className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg sm:p-7">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <LockKeyhole size={21} aria-hidden="true" />
        </div>

        <p className="text-xs font-semibold uppercase text-emerald-700">
          SaversStop security
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {hasPin ? 'Enter your PIN' : 'Create an app PIN'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {hasPin
            ? 'Your app is locked. Enter your six-digit PIN to continue.'
            : 'Choose a six-digit PIN. The app locks after five minutes without activity.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="app-pin"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              {hasPin ? 'PIN' : 'New PIN'}
            </label>
            <input
              id="app-pin"
              type="password"
              inputMode="numeric"
              autoComplete={hasPin ? 'current-password' : 'new-password'}
              pattern="[0-9]{6}"
              maxLength={6}
              value={pin}
              onChange={(event) => {
                setPin(event.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              autoFocus
              className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-lg tracking-[0.3em] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              aria-describedby="app-pin-help"
            />
            <p id="app-pin-help" className="mt-1.5 text-xs text-slate-500">
              Enter six numbers.
            </p>
          </div>

          {!hasPin && (
            <div>
              <label
                htmlFor="app-pin-confirm"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Confirm PIN
              </label>
              <input
                id="app-pin-confirm"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]{6}"
                maxLength={6}
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(
                    event.target.value.replace(/\D/g, '').slice(0, 6),
                  );
                  setError('');
                }}
                className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-lg tracking-[0.3em] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              working ||
              pin.length !== 6 ||
              (!hasPin && confirmation.length !== 6)
            }
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {working
              ? 'Please wait...'
              : hasPin
                ? 'Unlock SaversStop'
                : 'Create PIN and continue'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AppPinGate;
