import { useState, useRef, useEffect } from 'react';
import { searchUsers, sendFriendRequestById } from '../services/firestore';
import { useAuth } from '../context/AuthContext';

export default function FriendSearch({ onRequestSent }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const ref = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setMsg('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsers(val, user.id);
        setResults(users);
        setOpen(users.length > 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = async (selectedUser) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    try {
      await sendFriendRequestById(user.id, selectedUser.id);
      setMsg(`Request sent to ${selectedUser.name}!`);
      if (onRequestSent) onRequestSent();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => { if (results.length) setOpen(true); }}
        placeholder="Search by name or email..."
        className="w-full px-3 py-2 bg-theme-primary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-theme-muted border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute w-full mt-1 bg-theme-secondary border border-theme rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ zIndex: 50 }}>
          {results.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleSelect(u)}
              className="w-full text-left px-3 py-2.5 hover:bg-theme-tertiary text-sm flex items-center gap-3 transition"
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: u.icon_color || '#888' }} />
              <div className="flex-1 min-w-0">
                <span className="text-theme-primary block truncate">{u.name}</span>
                <span className="text-theme-faint text-xs block truncate">{u.email}</span>
              </div>
              <span className="text-xs text-theme-muted flex-shrink-0">Add</span>
            </button>
          ))}
        </div>
      )}

      {msg && <p className="text-xs text-theme-muted mt-1">{msg}</p>}
    </div>
  );
}
