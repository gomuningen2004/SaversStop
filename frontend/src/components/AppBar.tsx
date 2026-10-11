import { useState } from 'react';
import { KeyRound, LockKeyhole } from 'lucide-react';

import ChangeAppPinModal from './ChangeAppPinModal';

type AppBarProps = {
  onLockNow: () => void;
  onSavePin: (currentPin: string, newPin: string) => Promise<boolean>;
};

function AppBar({ onLockNow, onSavePin }: AppBarProps) {
  const [pinModalOpen, setPinModalOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 hidden h-16 border-b border-slate-200 bg-white lg:block">
        <div className="flex h-full items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-slate-900">SaversStop</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLockNow}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              <LockKeyhole size={16} aria-hidden="true" />
              Lock now
            </button>
            <button
              type="button"
              onClick={() => setPinModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              <KeyRound size={16} aria-hidden="true" />
              Change PIN
            </button>
          </div>
        </div>
      </header>

      {pinModalOpen && (
        <ChangeAppPinModal
          onClose={() => setPinModalOpen(false)}
          onSave={onSavePin}
        />
      )}
    </>
  );
}

export default AppBar;