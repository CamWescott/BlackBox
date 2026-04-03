import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateUserName, updateUserColor } from '../services/firestore';

const iconColors = [
  '#22c55e', '#3b82f6', '#ef4444', '#f97316', '#a855f7',
  '#ec4899', '#14b8a6', '#eab308', '#06b6d4', '#f43f5e',
  '#8b5cf6', '#10b981', '#64748b', '#ffffff',
];

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/history', label: 'History' },
  { path: '/feed', label: 'Feed' },
  { path: '/trips', label: 'Trips' },
];

export default function Header() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setEditingName(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const saveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === user.name) {
      setEditingName(false);
      setNameValue(user.name);
      return;
    }
    setSavingName(true);
    await updateUserName(user.id, nameValue.trim());
    updateUser({ name: nameValue.trim() });
    setSavingName(false);
    setEditingName(false);
  };

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

        {/* Profile button + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-theme-tertiary transition"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: user.icon_color }}>
                {(user.name || '?')[0].toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline text-theme-secondary text-sm">{user.name}</span>
            <svg className="w-3 h-3 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-theme-secondary border border-theme rounded-xl shadow-2xl overflow-hidden"
              style={{ zIndex: 9999 }}>
              {/* Profile header */}
              <div className="p-4 border-b border-theme">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: user.icon_color }}>
                      {(user.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {editingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={nameValue}
                          onChange={e => setNameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveName();
                            if (e.key === 'Escape') { setEditingName(false); setNameValue(user.name); }
                          }}
                          className="px-2 py-1 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm w-full focus:outline-none"
                        />
                        <button onClick={saveName} disabled={savingName}
                          className="text-xs text-theme-muted hover:text-theme-primary whitespace-nowrap">
                          {savingName ? '...' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-theme-primary font-semibold text-sm truncate">{user.name}</span>
                        <button onClick={() => { setEditingName(true); setNameValue(user.name); }}
                          className="text-xs text-theme-faint hover:text-theme-primary">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <p className="text-theme-muted text-xs truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                {/* Dark mode toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-theme-secondary hover:bg-theme-tertiary transition"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                </button>

                {/* Icon Color */}
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-4 h-4 text-theme-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <span className="text-sm text-theme-secondary">Icon Color</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-7">
                    {iconColors.map(c => (
                      <button
                        key={c}
                        onClick={async () => {
                          await updateUserColor(user.id, c);
                          updateUser({ icon_color: c });
                        }}
                        className={`w-5 h-5 rounded-full border-2 transition ${
                          user.icon_color === c ? 'scale-110 border-white' : 'border-transparent hover:border-theme'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-theme-tertiary transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
