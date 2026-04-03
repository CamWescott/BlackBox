import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TravelHistoryPage from './pages/TravelHistoryPage';
import FeedPage from './pages/FeedPage';
import GroupTripsPage from './pages/GroupTripsPage';

function NameSetupScreen() {
  const { user, finishNameSetup } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name'); return; }
    setLoading(true);
    try {
      await finishNameSetup(name.trim());
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-primary flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-theme-primary tracking-widest mb-4">
        BLACK<span className="text-theme-muted">BOX</span>
      </h1>
      <p className="text-theme-muted mb-8">Welcome! Choose a display name for your profile.</p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm text-theme-muted mb-1">Display Name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-theme-tertiary border border-theme rounded-lg text-theme-primary placeholder-gray-500 focus:outline-none focus:border-theme transition"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 font-semibold rounded-lg border-2 border-theme transition disabled:opacity-50"
          style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          {loading ? '...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.needsNameSetup) return <NameSetupScreen />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user && !user.needsNameSetup ? <Navigate to="/dashboard" /> : user?.needsNameSetup ? <NameSetupScreen /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><TravelHistoryPage /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute><GroupTripsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}
