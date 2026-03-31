import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, name, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-primary flex flex-col items-center justify-center px-4">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 text-theme-muted hover:text-theme-primary transition"
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

      {/* App Name */}
      <h1 className="text-5xl font-bold text-theme-primary tracking-widest mb-10">
        BLACK<span className="text-theme-muted">BOX</span>
      </h1>

      {/* The Black Box with World and Plane */}
      <div className="w-52 h-52 bg-theme-secondary border-2 border-theme rounded-lg flex items-center justify-center mb-10 shadow-2xl">
        <svg viewBox="0 0 200 200" className="w-40 h-40">
          {/* World outline */}
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="2" className="text-theme-primary" />
          {/* Latitude lines */}
          <ellipse cx="100" cy="100" rx="70" ry="25" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" className="text-theme-primary" />
          <ellipse cx="100" cy="100" rx="70" ry="50" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" className="text-theme-primary" />
          {/* Longitude lines */}
          <ellipse cx="100" cy="100" rx="25" ry="70" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" className="text-theme-primary" />
          <ellipse cx="100" cy="100" rx="50" ry="70" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" className="text-theme-primary" />
          {/* Equator */}
          <line x1="30" y1="100" x2="170" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.5" className="text-theme-primary" />
          {/* Prime meridian */}
          <line x1="100" y1="30" x2="100" y2="170" stroke="currentColor" strokeWidth="1" opacity="0.5" className="text-theme-primary" />
          {/* Airplane */}
          <g transform="translate(100,100) rotate(-30)">
            <path d="M-5,20 L-3,-25 L0,-35 L3,-25 L5,20 Z" fill="var(--bg-secondary)" stroke="currentColor" strokeWidth="1.5" className="text-theme-primary" />
            <path d="M-25,5 L-3,-5 L3,-5 L25,5 L20,8 L3,0 L-3,0 L-20,8 Z" fill="var(--bg-secondary)" stroke="currentColor" strokeWidth="1.5" className="text-theme-primary" />
            <path d="M-10,20 L-3,12 L3,12 L10,20 L8,22 L3,17 L-3,17 L-8,22 Z" fill="var(--bg-secondary)" stroke="currentColor" strokeWidth="1.5" className="text-theme-primary" />
          </g>
        </svg>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {isRegister && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-theme-tertiary border border-theme rounded-lg text-theme-primary placeholder-gray-500 focus:outline-none focus:border-theme transition"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-theme-tertiary border border-theme rounded-lg text-theme-primary placeholder-gray-500 focus:outline-none focus:border-theme transition"
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 pr-12 bg-theme-tertiary border border-theme rounded-lg text-theme-primary placeholder-gray-500 focus:outline-none focus:border-theme transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-faint hover:text-theme-secondary transition text-sm select-none"
          >
            {showPassword ? 'HIDE' : 'SHOW'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-theme-primary text-theme-primary font-semibold rounded-lg border-2 border-theme hover:bg-theme-tertiary transition disabled:opacity-50"
          style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          {loading ? '...' : isRegister ? 'Create Account' : 'Log In'}
        </button>

        <p className="text-center text-theme-muted text-sm">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-theme-primary underline hover:text-theme-secondary"
          >
            {isRegister ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  );
}
