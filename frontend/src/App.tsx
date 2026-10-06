import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AppBar from './components/AppBar';
import Navigation from './components/Navigation';
import AppPinGate from './components/AppPinGate';
import { useAppPin } from './hooks/useAppPin';

import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import Forecast from './pages/Forecast';
import Categories from './pages/Categories';
import ManageCategories from './pages/ManageCategories';
import Goals from './pages/Goals';
import People from './pages/People';

function App() {
  const { hasPin, isLocked, lockNow, createPin, unlock, changePin } =
    useAppPin();
  const requiresUnlock = !hasPin || isLocked;

  return (
    <BrowserRouter>
      <div
        aria-hidden={requiresUnlock}
        inert={requiresUnlock}
        className="min-h-screen bg-slate-50 text-slate-900"
      >
        {/* Top Application Bar */}
        <AppBar />

        {/* Navigation */}
        <Navigation onLockNow={lockNow} onSavePin={changePin} />

        {/* Main Application Content */}
        <div className="min-w-0 pb-20 lg:pl-64 lg:pt-16 lg:pb-0">
          {!requiresUnlock && (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/manage" element={<ManageCategories />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/people" element={<People />} />
            </Routes>
          )}
        </div>
      </div>

      {requiresUnlock && (
        <AppPinGate hasPin={hasPin} onCreatePin={createPin} onUnlock={unlock} />
      )}
    </BrowserRouter>
  );
}

export default App;
