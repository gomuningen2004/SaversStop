import { useState } from 'react';

import {
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  ChevronUp,
  Home,
  PiggyBank,
  Tags,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

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
    to: '/recurring-transactions',
    label: 'Recurring',
    icon: CalendarClock,
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

function Navigation() {
  const [moreOpen, setMoreOpen] = useState(false);

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
      </aside>

      {/* Mobile More Menu */}
      {moreOpen && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-slate-200 bg-white shadow-lg lg:hidden">
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
    </>
  );
}

export default Navigation;
