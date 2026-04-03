import { useState, useRef, useEffect } from 'react';
import { searchAirports } from '../data/airports';

export default function AirportSearch({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value ? `${value.code} - ${value.city}` : '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Sync display when value changes externally (e.g. flight lookup)
  useEffect(() => {
    if (value && value.code) {
      setQuery(`${value.code} - ${value.city || value.name || ''}`);
    } else if (!value) {
      setQuery('');
    }
  }, [value?.code]);

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
    if (val.length >= 2) {
      setResults(searchAirports(val));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  };

  const select = (airport) => {
    setQuery(`${airport.code} - ${airport.city}`);
    onChange(airport);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm text-theme-muted mb-1">{label}</label>}
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => { if (results.length) setOpen(true); }}
        placeholder={placeholder || 'Search airport...'}
        className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
      />
      {open && results.length > 0 && (
        <div className="absolute w-full mt-1 bg-theme-secondary border border-theme rounded shadow-xl max-h-48 overflow-y-auto" style={{ zIndex: 10000 }}>
          {results.map((a) => (
            <button
              key={a.code}
              type="button"
              onClick={() => select(a)}
              className="w-full text-left px-3 py-2 hover:bg-theme-tertiary text-sm text-theme-primary"
            >
              <span className="font-mono text-theme-secondary">{a.code}</span>{' '}
              <span className="text-theme-muted">- {a.name}, {a.city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
