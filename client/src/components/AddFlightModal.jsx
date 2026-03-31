import { useState } from 'react';
import AirportSearch from './AirportSearch';
import { api } from '../api';

const airlines = [
  'Delta', 'United', 'American Airlines', 'Southwest', 'JetBlue',
  'Alaska Airlines', 'Spirit', 'Frontier', 'Hawaiian Airlines',
  'British Airways', 'Lufthansa', 'Air France', 'Emirates',
  'Qatar Airways', 'Singapore Airlines', 'Qantas', 'KLM',
  'Turkish Airlines', 'Cathay Pacific', 'ANA', 'JAL', 'Other'
];

const cabinClasses = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
];

function LegForm({ leg, index, onChange, onRemove, showRemove }) {
  const update = (field, value) => onChange(index, field, value);

  return (
    <div className="border border-theme rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-theme-muted font-medium">
          {showRemove ? `Leg ${index + 1}` : 'Flight Details'}
        </span>
        {showRemove && (
          <button type="button" onClick={() => onRemove(index)} className="text-xs text-red-400 hover:text-red-300">&times; Remove</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-theme-muted mb-1">Airline</label>
          <select
            value={leg.airline}
            onChange={(e) => update('airline', e.target.value)}
            required
            className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none"
          >
            <option value="">Select...</option>
            {airlines.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-theme-muted mb-1">Flight Number</label>
          <input
            type="text"
            value={leg.flight_number}
            onChange={(e) => update('flight_number', e.target.value)}
            placeholder="e.g. DL1234"
            required
            className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AirportSearch label="Origin" value={leg.origin} onChange={(v) => update('origin', v)} placeholder="From..." />
        <AirportSearch label="Destination" value={leg.destination} onChange={(v) => update('destination', v)} placeholder="To..." />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-theme-muted mb-1">Seat</label>
          <input
            type="text"
            value={leg.seat_number}
            onChange={(e) => update('seat_number', e.target.value)}
            placeholder="14A"
            className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-theme-muted mb-1">Class</label>
          <select
            value={leg.cabin_class}
            onChange={(e) => update('cabin_class', e.target.value)}
            className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none"
          >
            {cabinClasses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-theme-muted mb-1">Date</label>
          <input
            type="date"
            value={leg.travel_date}
            onChange={(e) => update('travel_date', e.target.value)}
            required
            className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-theme-muted mb-1">Notes</label>
        <input
          type="text"
          value={leg.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Window seat, great views..."
          className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

const emptyLeg = () => ({
  airline: '', flight_number: '', origin: null, destination: null,
  seat_number: '', cabin_class: 'economy', notes: '', travel_date: '',
});

export default function AddFlightModal({ onClose, onFlightAdded, friends = [] }) {
  const [isMultiLeg, setIsMultiLeg] = useState(false);
  const [legs, setLegs] = useState([emptyLeg()]);
  const [status, setStatus] = useState('booked');
  const [companions, setCompanions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateLeg = (index, field, value) => {
    const updated = [...legs];
    updated[index] = { ...updated[index], [field]: value };
    setLegs(updated);
  };

  const addLeg = () => {
    const prevLeg = legs[legs.length - 1];
    const newLeg = emptyLeg();
    if (prevLeg.destination) {
      newLeg.origin = prevLeg.destination;
    }
    if (prevLeg.travel_date) {
      newLeg.travel_date = prevLeg.travel_date;
    }
    setLegs([...legs, newLeg]);
  };

  const removeLeg = (index) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, i) => i !== index));
    if (legs.length <= 2) setIsMultiLeg(false);
  };

  const addCompanion = () => {
    setCompanions([...companions, { name: '', email: '', seat_number: '' }]);
  };

  const updateCompanion = (index, field, value) => {
    const updated = [...companions];
    updated[index][field] = value;
    setCompanions(updated);
  };

  const removeCompanion = (index) => {
    setCompanions(companions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    for (const leg of legs) {
      if (!leg.origin || !leg.destination) {
        setError('Please select origin and destination for all flights');
        return;
      }
      if (!leg.airline || !leg.flight_number || !leg.travel_date) {
        setError('Please fill in airline, flight number, and date for all flights');
        return;
      }
    }

    setLoading(true);

    try {
      const filteredCompanions = companions.filter(c => c.name);

      if (isMultiLeg && legs.length > 1) {
        const legsPayload = legs.map(leg => ({
          airline: leg.airline,
          flight_number: leg.flight_number,
          origin_code: leg.origin.code,
          origin_name: leg.origin.name,
          origin_lat: leg.origin.lat,
          origin_lng: leg.origin.lng,
          destination_code: leg.destination.code,
          destination_name: leg.destination.name,
          destination_lat: leg.destination.lat,
          destination_lng: leg.destination.lng,
          seat_number: leg.seat_number,
          cabin_class: leg.cabin_class,
          notes: leg.notes,
          travel_date: leg.travel_date,
          status,
        }));

        const result = await api.post('/api/flights', {
          legs: legsPayload,
          companions: filteredCompanions,
        });

        if (Array.isArray(result)) {
          result.forEach(f => onFlightAdded(f));
        } else {
          onFlightAdded(result);
        }
      } else {
        const leg = legs[0];
        const flight = await api.post('/api/flights', {
          airline: leg.airline,
          flight_number: leg.flight_number,
          origin_code: leg.origin.code,
          origin_name: leg.origin.name,
          origin_lat: leg.origin.lat,
          origin_lng: leg.origin.lng,
          destination_code: leg.destination.code,
          destination_name: leg.destination.name,
          destination_lat: leg.destination.lat,
          destination_lng: leg.destination.lng,
          seat_number: leg.seat_number,
          cabin_class: leg.cabin_class,
          notes: leg.notes,
          travel_date: leg.travel_date,
          status,
          companions: filteredCompanions,
        });
        onFlightAdded(flight);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-theme-primary border border-theme rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-theme-primary">Add Flight</h2>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary text-2xl">&times;</button>
        </div>

        {/* Trip type toggle */}
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => { setIsMultiLeg(false); setLegs([legs[0]]); }}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${!isMultiLeg ? 'border-theme text-theme-primary' : 'text-theme-muted border-theme hover:text-theme-secondary'}`}
            style={!isMultiLeg ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' } : {}}
          >
            Direct Flight
          </button>
          <button
            type="button"
            onClick={() => { setIsMultiLeg(true); if (legs.length < 2) addLeg(); }}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${isMultiLeg ? 'border-theme text-theme-primary' : 'text-theme-muted border-theme hover:text-theme-secondary'}`}
            style={isMultiLeg ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' } : {}}
          >
            Connecting / Multi-leg
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded text-sm">{error}</div>
          )}

          <div className="space-y-3">
            {legs.map((leg, i) => (
              <LegForm
                key={i}
                leg={leg}
                index={i}
                onChange={updateLeg}
                onRemove={removeLeg}
                showRemove={isMultiLeg && legs.length > 1}
              />
            ))}
          </div>

          {isMultiLeg && (
            <button
              type="button"
              onClick={addLeg}
              className="w-full py-2 text-sm border border-dashed border-theme text-theme-muted rounded-lg hover:text-theme-primary hover:border-theme transition"
            >
              + Add Another Leg
            </button>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm text-theme-muted mb-1">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-theme-secondary cursor-pointer">
                <input type="radio" value="booked" checked={status === 'booked'} onChange={() => setStatus('booked')} className="accent-white" />
                Booked (Future)
              </label>
              <label className="flex items-center gap-2 text-sm text-theme-secondary cursor-pointer">
                <input type="radio" value="flown" checked={status === 'flown'} onChange={() => setStatus('flown')} className="accent-white" />
                Already Flown
              </label>
            </div>
          </div>

          {/* Companions */}
          <div>
            <label className="text-sm text-theme-muted mb-2 block">Travel Companions</label>

            {friends.length > 0 && (
              <div className="mb-3">
                <select
                  onChange={(e) => {
                    const friendId = e.target.value;
                    if (!friendId) return;
                    const friend = friends.find(f => String(f.id) === friendId);
                    if (friend && !companions.find(c => c.email === friend.email)) {
                      setCompanions([...companions, { name: friend.name, email: friend.email, seat_number: '', fromFriend: true }]);
                    }
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none"
                >
                  <option value="">Select from friends...</option>
                  {friends
                    .filter(f => !companions.find(c => c.email === f.email))
                    .map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex justify-end mb-2">
              <button type="button" onClick={addCompanion} className="text-xs text-theme-secondary hover:text-theme-primary border border-theme px-2 py-1 rounded">
                + Add Manually
              </button>
            </div>

            {companions.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                {c.fromFriend ? (
                  <div className="flex-1 px-2 py-1.5 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: friends.find(f => f.email === c.email)?.icon_color || '#888' }} />
                    {c.name}
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateCompanion(i, 'name', e.target.value)}
                      placeholder="Name"
                      className="flex-1 px-2 py-1.5 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
                    />
                    <input
                      type="email"
                      value={c.email}
                      onChange={(e) => updateCompanion(i, 'email', e.target.value)}
                      placeholder="Email (optional)"
                      className="flex-1 px-2 py-1.5 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
                    />
                  </>
                )}
                <input
                  type="text"
                  value={c.seat_number}
                  onChange={(e) => updateCompanion(i, 'seat_number', e.target.value)}
                  placeholder="Seat"
                  className="w-16 px-2 py-1.5 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
                />
                <button type="button" onClick={() => removeCompanion(i)} className="text-red-400 hover:text-red-300 px-1">&times;</button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            {loading ? 'Adding...' : isMultiLeg ? `Add Trip (${legs.length} legs)` : 'Add Flight'}
          </button>
        </form>
      </div>
    </div>
  );
}
