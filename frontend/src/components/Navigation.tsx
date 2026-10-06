import { useLayoutEffect, useState } from 'react';

import {
  ArrowLeftRight,
  BarChart3,
  ChevronUp,
  Home,
  KeyRound,
  LockKeyhole,
  PiggyBank,
  Settings2,
  Tags,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';
import ChangeAppPinModal from './ChangeAppPinModal';

type ThemePreference = 'system' | 'light' | 'dark';
type NavigationProps = {
  onLockNow: () => void;
  onSavePin: (currentPin: string, newPin: string) => Promise<boolean>;
};

const themeStorageKey = 'saversstop-theme';

function getInitialThemePreference(): ThemePreference {
  const savedTheme = window.localStorage.getItem(themeStorageKey);
  return savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : 'system';
}

function ThemeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        Theme
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as ThemePreference)}
        className="block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        <option value="system">Use device setting</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}

const navItems = [
  {
    to: '/',
    label: 'Home',
    icon: Home,
  },
  {
    to: '/accounts',
    label: 'Accounts',
    icon: WalletCards,
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
  },
  {
    to: '/budgets',
    label: 'Budgets',
    icon: PiggyBank,
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    to: '/forecast',
    label: 'Forecast',
    icon: TrendingUp,
  },
  {
    to: '/categories',
    label: 'Categories',
    icon: Tags,
  },
  {
    to: '/goals',
    label: 'Goals',
    icon: Target,
  },
  {
    to: '/people',
    label: 'People',
    icon: Users,
  },
];

const mobilePrimaryItems = navItems.slice(0, 3);
const mobileMoreItems = navItems.slice(3);

function Navigation({ onLockNow, onSavePin }: NavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    getInitialThemePreference,
  );

  useLayoutEffect(() => {
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const useDarkTheme =
        themePreference === 'dark' ||
        (themePreference === 'system' && systemPreference.matches);
      document.documentElement.dataset.theme = useDarkTheme ? 'dark' : 'light';
    };

    applyTheme();
    window.localStorage.setItem(themeStorageKey, themePreference);

    if (themePreference === 'system') {
      systemPreference.addEventListener('change', applyTheme);
      return () => systemPreference.removeEventListener('change', applyTheme);
    }
  }, [themePreference]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 top-16 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <nav className="px-4 py-6">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={2} />

                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
        <div className="absolute inset-x-4 bottom-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Settings2 size={16} aria-hidden="true" />
            Settings
          </div>
          <ThemeSelect
            id="desktop-theme-preference"
            value={themePreference}
            onChange={setThemePreference}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onLockNow}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              <LockKeyhole size={14} aria-hidden="true" />
              Lock now
            </button>
            <button
              type="button"
              onClick={() => setPinModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              <KeyRound size={14} aria-hidden="true" />
              Change PIN
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile More Menu */}
      {moreOpen && (
        <div className="fixed inset-x-0 bottom-16 z-40 max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-slate-200 bg-white shadow-lg lg:hidden">
          <div className="grid grid-cols-2 gap-2 p-4">
            {mobileMoreItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={2} />

                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
          <div className="border-t border-slate-200 px-4 pb-4 pt-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Settings2 size={16} aria-hidden="true" />
              Settings
            </div>
            <ThemeSelect
              id="mobile-theme-preference"
              value={themePreference}
              onChange={setThemePreference}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onLockNow}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
              >
                <LockKeyhole size={16} aria-hidden="true" />
                Lock now
              </button>
              <button
                type="button"
                onClick={() => setPinModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
              >
                <KeyRound size={16} aria-hidden="true" />
                Change PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white lg:hidden">
        <div className="grid grid-cols-4">
          {/* Primary Navigation Items */}
          {mobilePrimaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-w-0 flex-col items-center justify-center gap-1 py-3 ${
                    isActive ? 'text-slate-900' : 'text-slate-500'
                  }`
                }
              >
                <Icon size={20} strokeWidth={2} />

                <span className="truncate text-[11px] font-medium">
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* More Button */}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 py-3 ${
              moreOpen ? 'text-slate-900' : 'text-slate-500'
            }`}
          >
            {moreOpen ? (
              <X size={20} strokeWidth={2} />
            ) : (
              <ChevronUp size={20} strokeWidth={2} />
            )}

            <span className="text-[11px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {pinModalOpen && (
        <ChangeAppPinModal
          onClose={() => setPinModalOpen(false)}
          onSave={onSavePin}
        />
      )}
    </>
  );
}

export default Navigation;
