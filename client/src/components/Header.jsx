import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/history', label: 'History' },
  { path: '/feed', label: 'Feed' },
  { path: '/trips', label: 'Trips' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="border-b border-theme px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center bg-theme-secondary">
      <h1
        className="text-xl sm:text-2xl font-bold text-theme-primary tracking-widest cursor-pointer"
        onClick={() => navigate('/dashboard')}
      >
        BLACK<span className="text-theme-muted">BOX</span>
      </h1>
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Nav links */}
        <nav className="flex gap-1">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-lg transition ${
                location.pathname === item.path
                  ? 'bg-theme-tertiary text-theme-primary font-medium'
                  : 'text-theme-muted hover:text-theme-secondary hover:bg-theme-tertiary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-theme-muted hover:text-theme-primary transition"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User info - hide on mobile */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.icon_color }} />
          <span className="text-theme-secondary text-sm">{user.name}</span>
        </div>

        <button onClick={logout} className="text-theme-muted hover:text-theme-primary text-xs sm:text-sm">Logout</button>
      </div>
    </header>
  );
}
