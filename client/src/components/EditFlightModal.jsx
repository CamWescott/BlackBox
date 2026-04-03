import { useState, useRef, useEffect } from 'react';
import AirportSearch from './AirportSearch';
import { updateFlight } from '../services/firestore';

const airlines = [
  'Aer Lingus', 'Aeromexico', 'Air Canada', 'Air France', 'Air India',
  'Air New Zealand', 'Alaska Airlines', 'Allegiant Air', 'American Airlines',
  'ANA', 'Avianca', 'Breeze Airways', 'British Airways', 'Cape Air',
  'Cathay Pacific', 'Copa Airlines', 'Delta', 'EasyJet', 'Emirates',
  'Ethiopian Airlines', 'Etihad Airways', 'EVA Air', 'Finnair',
  'Frontier', 'Hawaiian Airlines', 'Iberia', 'Icelandair', 'ITA Airways',
  'JAL', 'JetBlue', 'KLM', 'Korean Air', 'LATAM', 'LOT Polish Airlines',
  'Lufthansa', 'Norwegian', 'Qantas', 'Qatar Airways', 'Ryanair',
  'SAS Scandinavian', 'Singapore Airlines', 'Southwest', 'Spirit',
  'Sun Country', 'Swiss International', 'TAP Air Portugal',
  'Turkish Airlines', 'United', 'Virgin Atlantic', 'Vueling',
  'WestJet', 'Wizz Air',
];

const cabinClasses = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
];

function AirlineInput({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = query
    ? airlines.filter(a => a.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : airlines.slice(0, 8);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm text-theme-muted mb-1">Airline</label>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Type or search..."
        required
        className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
      />
      {open && filtered.length > 0 && (
        <div className="absolute w-full mt-1 bg-theme-secondary border border-theme rounded shadow-xl max-h-40 overflow-y-auto" style={{ zIndex: 10000 }}>
          {filtered.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => { setQuery(a); onChange(a); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-theme-tertiary text-sm text-theme-primary"
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditFlightModal({ flight, onClose, onFlightUpdated }) {
  const [airline, setAirline] = useState(flight.airline);
  const [flightNumber, setFlightNumber] = useState(flight.flight_number);
  const [origin, setOrigin] = useState({
    code: flight.origin_code, name: flight.origin_name,
    lat: flight.origin_lat, lng: flight.origin_lng,
    city: flight.origin_name,
  });
  const [destination, setDestination] = useState({
    code: flight.destination_code, name: flight.destination_name,
    lat: flight.destination_lat, lng: flight.destination_lng,
    city: flight.destination_name,
  });
  const [seatNumber, setSeatNumber] = useState(flight.seat_number || '');
  const [cabinClass, setCabinClass] = useState(flight.cabin_class || 'economy');
  const [notes, setNotes] = useState(flight.notes || '');
  const [travelDate, setTravelDate] = useState(flight.travel_date);
  const [status, setStatus] = useState(flight.status);
  const [aircraft, setAircraft] = useState(flight.aircraft || '');
  const [departureTerminal, setDepartureTerminal] = useState(flight.departure_terminal || '');
  const [departureGate, setDepartureGate] = useState(flight.departure_gate || '');
  const [departureTime, setDepartureTime] = useState(flight.departure_time || '');
  const [arrivalTerminal, setArrivalTerminal] = useState(flight.arrival_terminal || '');
  const [arrivalGate, setArrivalGate] = useState(flight.arrival_gate || '');
  const [arrivalTime, setArrivalTime] = useState(flight.arrival_time || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!origin || !destination) {
      setError('Please select origin and destination');
      return;
    }
    if (!airline || !flightNumber || !travelDate) {
      setError('Please fill in airline, flight number, and date');
      return;
    }

    setLoading(true);
    try {
      const updated = await updateFlight(flight.id, {
        airline,
        flight_number: flightNumber,
        origin_code: origin.code,
        origin_name: origin.name,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_code: destination.code,
        destination_name: destination.name,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        seat_number: seatNumber,
        cabin_class: cabinClass,
        notes,
        travel_date: travelDate,
        status,
        aircraft,
        departure_terminal: departureTerminal,
        departure_gate: departureGate,
        departure_time: departureTime,
        arrival_terminal: arrivalTerminal,
        arrival_gate: arrivalGate,
        arrival_time: arrivalTime,
      });
      onFlightUpdated(updated);
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
          <h2 className="text-xl font-bold text-theme-primary">Edit Flight</h2>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <AirlineInput value={airline} onChange={setAirline} />
            <div>
              <label className="block text-sm text-theme-muted mb-1">Flight Number</label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                required
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AirportSearch label="Origin" value={origin} onChange={setOrigin} placeholder="From..." />
            <AirportSearch label="Destination" value={destination} onChange={setDestination} placeholder="To..." />
          </div>

          <div>
            <label className="block text-sm text-theme-muted mb-1">Date</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-theme-muted mb-1">Aircraft</label>
              <input
                type="text"
                value={aircraft}
                onChange={(e) => setAircraft(e.target.value)}
                placeholder="e.g. Boeing 737-800"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">Distance</label>
              <input
                type="text"
                value={flight.distance_miles ? `${Math.round(flight.distance_miles)} mi` : ''}
                readOnly
                placeholder="Via Flight Search"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-muted text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-theme-muted mb-1">Departure Time</label>
              <input
                type="text"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="e.g. 08:30"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">Arrival Time</label>
              <input
                type="text"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                placeholder="e.g. 11:45"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-theme-muted mb-1">Dep Terminal</label>
              <input
                type="text"
                value={departureTerminal}
                onChange={(e) => setDepartureTerminal(e.target.value)}
                placeholder="T2"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">Dep Gate</label>
              <input
                type="text"
                value={departureGate}
                onChange={(e) => setDepartureGate(e.target.value)}
                placeholder="B42"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">Arr Terminal</label>
              <input
                type="text"
                value={arrivalTerminal}
                onChange={(e) => setArrivalTerminal(e.target.value)}
                placeholder="T1"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">Arr Gate</label>
              <input
                type="text"
                value={arrivalGate}
                onChange={(e) => setArrivalGate(e.target.value)}
                placeholder="C12"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-theme-muted mb-1">Seat</label>
              <input
                type="text"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                placeholder="14A"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">Class</label>
              <select
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value)}
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none"
              >
                {cabinClasses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-theme-muted mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Window seat, great views..."
              className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-theme-muted mb-1">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-theme-secondary cursor-pointer">
                <input type="radio" value="booked" checked={status === 'booked'} onChange={() => setStatus('booked')} className="accent-white" />
                Booked
              </label>
              <label className="flex items-center gap-2 text-sm text-theme-secondary cursor-pointer">
                <input type="radio" value="flown" checked={status === 'flown'} onChange={() => setStatus('flown')} className="accent-white" />
                Flown
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
