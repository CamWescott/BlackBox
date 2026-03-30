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

export default function AddFlightModal({ onClose, onFlightAdded }) {
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [seatNumber, setSeatNumber] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [status, setStatus] = useState('booked');
  const [companions, setCompanions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!origin || !destination) {
      setError('Please select origin and destination airports');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const flight = await api.post('/api/flights', {
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
        travel_date: travelDate,
        status,
        companions: companions.filter(c => c.name),
      });
      onFlightAdded(flight);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-blackbox-dark border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add Flight</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded text-sm">{error}</div>
          )}

          {/* Airline */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Airline</label>
            <select
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              required
              className="w-full px-3 py-2 bg-blackbox-gray border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-gray-500"
            >
              <option value="">Select airline...</option>
              {airlines.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Flight Number */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Flight Number</label>
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="e.g. DL1234"
              required
              className="w-full px-3 py-2 bg-blackbox-gray border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Origin / Destination */}
          <div className="grid grid-cols-2 gap-3">
            <AirportSearch label="Origin" value={origin} onChange={setOrigin} placeholder="From..." />
            <AirportSearch label="Destination" value={destination} onChange={setDestination} placeholder="To..." />
          </div>

          {/* Seat & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Seat Number</label>
              <input
                type="text"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                placeholder="e.g. 14A"
                className="w-full px-3 py-2 bg-blackbox-gray border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Travel Date</label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-blackbox-gray border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="radio" value="booked" checked={status === 'booked'} onChange={() => setStatus('booked')} className="accent-white" />
                Booked (Future)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="radio" value="flown" checked={status === 'flown'} onChange={() => setStatus('flown')} className="accent-white" />
                Already Flown
              </label>
            </div>
          </div>

          {/* Companions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-400">Travel Companions</label>
              <button type="button" onClick={addCompanion} className="text-xs text-gray-300 hover:text-white border border-gray-600 px-2 py-1 rounded">
                + Add Companion
              </button>
            </div>
            {companions.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => updateCompanion(i, 'name', e.target.value)}
                  placeholder="Name"
                  className="flex-1 px-2 py-1.5 bg-blackbox-gray border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none"
                />
                <input
                  type="email"
                  value={c.email}
                  onChange={(e) => updateCompanion(i, 'email', e.target.value)}
                  placeholder="Email (optional)"
                  className="flex-1 px-2 py-1.5 bg-blackbox-gray border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={c.seat_number}
                  onChange={(e) => updateCompanion(i, 'seat_number', e.target.value)}
                  placeholder="Seat"
                  className="w-16 px-2 py-1.5 bg-blackbox-gray border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none"
                />
                <button type="button" onClick={() => removeCompanion(i)} className="text-red-400 hover:text-red-300 px-1">&times;</button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Flight'}
          </button>
        </form>
      </div>
    </div>
  );
}
