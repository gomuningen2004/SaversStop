import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AppBar from './components/AppBar';
import Navigation from './components/Navigation';

import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Categories from './pages/Categories';
import ManageCategories from './pages/ManageCategories';
import Goals from './pages/Goals';
import ManageGoals from './pages/ManageGoals';
import People from './pages/People';
import Accounts from './pages/Accounts';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';
import RecurringTransactions from './pages/RecurringTransactions';
import Forecast from './pages/Forecast';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Top Application Bar */}
        <AppBar />

        {/* Navigation */}
        <Navigation />

        {/* Main Application Content */}
        <div className="min-w-0 pt-16 pb-20 lg:pl-64 lg:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/add-transaction" element={<AddTransaction />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/manage" element={<ManageCategories />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/goals/manage" element={<ManageGoals />} />
            <Route path="/people" element={<People />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route
              path="/recurring-transactions"
              element={<RecurringTransactions />}
            />
            <Route path="/forecast" element={<Forecast />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
