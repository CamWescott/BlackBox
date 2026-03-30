import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TravelHistoryPage from './pages/TravelHistoryPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><TravelHistoryPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}
