import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
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
    <div className="min-h-screen bg-blackbox-dark flex flex-col items-center justify-center px-4">
      {/* App Name */}
      <h1 className="text-5xl font-bold text-white tracking-widest mb-10">
        BLACK<span className="text-gray-400">BOX</span>
      </h1>

      {/* The Black Box with World and Plane */}
      <div className="w-52 h-52 bg-black border-2 border-gray-700 rounded-lg flex items-center justify-center mb-10 shadow-2xl">
        <svg viewBox="0 0 200 200" className="w-40 h-40">
          {/* World outline - white */}
          <circle cx="100" cy="100" r="70" fill="none" stroke="white" strokeWidth="2" />
          {/* Latitude lines */}
          <ellipse cx="100" cy="100" rx="70" ry="25" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
          <ellipse cx="100" cy="100" rx="70" ry="50" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          {/* Longitude lines */}
          <ellipse cx="100" cy="100" rx="25" ry="70" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
          <ellipse cx="100" cy="100" rx="50" ry="70" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          {/* Equator */}
          <line x1="30" y1="100" x2="170" y2="100" stroke="white" strokeWidth="1" opacity="0.5" />
          {/* Prime meridian */}
          <line x1="100" y1="30" x2="100" y2="170" stroke="white" strokeWidth="1" opacity="0.5" />
          {/* Airplane - black */}
          <g transform="translate(100,100) rotate(-30)">
            {/* Fuselage */}
            <path d="M-5,20 L-3,-25 L0,-35 L3,-25 L5,20 Z" fill="black" stroke="white" strokeWidth="1.5" />
            {/* Wings */}
            <path d="M-25,5 L-3,-5 L3,-5 L25,5 L20,8 L3,0 L-3,0 L-20,8 Z" fill="black" stroke="white" strokeWidth="1.5" />
            {/* Tail */}
            <path d="M-10,20 L-3,12 L3,12 L10,20 L8,22 L3,17 L-3,17 L-8,22 Z" fill="black" stroke="white" strokeWidth="1.5" />
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
            className="w-full px-4 py-3 bg-blackbox-gray border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-blackbox-gray border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 pr-12 bg-blackbox-gray border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-sm select-none"
          >
            {showPassword ? 'HIDE' : 'SHOW'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          {loading ? '...' : isRegister ? 'Create Account' : 'Log In'}
        </button>

        <p className="text-center text-gray-500 text-sm">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-white underline hover:text-gray-300"
          >
            {isRegister ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  );
}
