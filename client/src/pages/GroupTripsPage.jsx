import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getGroupTrips, createGroupTrip, deleteGroupTrip,
  getGroupTripFlights, addFlightToGroupTrip, addMemberToGroupTrip,
  getFriends, getUserProfile,
} from '../services/firestore';
import AirportSearch from '../components/AirportSearch';
import Header from '../components/Header';

const airlines = [
  'Delta', 'United', 'American Airlines', 'Southwest', 'JetBlue',
  'Alaska Airlines', 'Spirit', 'Frontier', 'Hawaiian Airlines',
  'British Airways', 'Lufthansa', 'Air France', 'Emirates',
  'Qatar Airways', 'Singapore Airlines', 'Qantas', 'KLM',
  'Turkish Airlines', 'Cathay Pacific', 'ANA', 'JAL', 'Other'
];

function CreateTripModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter a trip name'); return; }
    onCreate({ name: name.trim(), description, start_date: startDate, end_date: endDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-theme-primary border border-theme rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-theme-primary">New Group Trip</h2>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-theme-muted mb-1">Trip Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring Break 2026"
              className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-theme-muted mb-1">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details..."
              className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-theme-muted mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full py-2 font-semibold rounded-lg transition"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
            Create Trip
          </button>
        </form>
      </div>
    </div>
  );
}

function AddTripFlightModal({ onClose, onAdd }) {
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [seatNumber, setSeatNumber] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!origin || !destination) { setError('Select origin and destination'); return; }
    if (!airline || !flightNumber || !travelDate) { setError('Fill in all required fields'); return; }
    onAdd({
      airline, flight_number: flightNumber,
      origin_code: origin.code, origin_name: origin.name, origin_lat: origin.lat, origin_lng: origin.lng,
      destination_code: destination.code, destination_name: destination.name, destination_lat: destination.lat, destination_lng: destination.lng,
      seat_number: seatNumber, cabin_class: 'economy', travel_date: travelDate, status: 'booked', notes: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-theme-primary border border-theme rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-theme-primary">Add Flight to Trip</h2>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-theme-muted mb-1">Airline</label>
              <select value={airline} onChange={e => setAirline(e.target.value)} required
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none">
                <option value="">Select...</option>
                {airlines.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">Flight #</label>
              <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder="DL1234"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AirportSearch label="Origin" value={origin} onChange={setOrigin} placeholder="From..." />
            <AirportSearch label="Destination" value={destination} onChange={setDestination} placeholder="To..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-theme-muted mb-1">Date</label>
              <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} required
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">Seat</label>
              <input type="text" value={seatNumber} onChange={e => setSeatNumber(e.target.value)} placeholder="14A"
                className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full py-2 font-semibold rounded-lg transition"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
            Add Flight
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GroupTripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [friends, setFriends] = useState([]);
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [tripFlights, setTripFlights] = useState({});
  const [tripMembers, setTripMembers] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [showAddFlight, setShowAddFlight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTrips(); }, []);

  const loadTrips = async () => {
    try {
      const [tripData, friendData] = await Promise.all([
        getGroupTrips(user.id),
        getFriends(user.id),
      ]);
      setTrips(tripData);
      setFriends(friendData.filter(f => f.status === 'accepted'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (data) => {
    try {
      const trip = await createGroupTrip(user.id, data);
      setTrips([trip, ...trips]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await deleteGroupTrip(tripId);
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpandTrip = async (trip) => {
    if (expandedTrip === trip.id) {
      setExpandedTrip(null);
      return;
    }
    setExpandedTrip(trip.id);
    try {
      const flights = await getGroupTripFlights(trip.id);
      setTripFlights(prev => ({ ...prev, [trip.id]: flights }));

      // Load member profiles
      const members = {};
      for (const memberId of (trip.member_ids || [])) {
        try {
          const profile = await getUserProfile(memberId);
          if (profile) members[memberId] = profile;
        } catch (_) {}
      }
      setTripMembers(prev => ({ ...prev, [trip.id]: members }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFlight = async (tripId, flightData) => {
    try {
      const flight = await addFlightToGroupTrip(user.id, tripId, flightData);
      setTripFlights(prev => ({
        ...prev,
        [tripId]: [...(prev[tripId] || []), flight],
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteFriend = async (tripId, friendId) => {
    try {
      await addMemberToGroupTrip(tripId, friendId);
      setTrips(trips.map(t => {
        if (t.id === tripId) {
          return { ...t, member_ids: [...(t.member_ids || []), friendId] };
        }
        return t;
      }));
      // Reload member profiles
      const profile = await getUserProfile(friendId);
      if (profile) {
        setTripMembers(prev => ({
          ...prev,
          [tripId]: { ...(prev[tripId] || {}), [friendId]: profile },
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-theme-muted">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-theme-primary">Group Trips</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 text-sm font-semibold rounded-lg border border-theme text-theme-primary hover:bg-theme-tertiary transition"
          >
            + New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="bg-theme-secondary border border-theme-light rounded-xl p-12 text-center">
            <p className="text-theme-muted text-lg mb-2">No group trips yet</p>
            <p className="text-theme-faint text-sm">Create a trip and invite friends to plan travel together</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => {
              const isExpanded = expandedTrip === trip.id;
              const flights = tripFlights[trip.id] || [];
              const members = tripMembers[trip.id] || {};
              const isOwner = trip.owner_id === user.id;
              const uninvitedFriends = friends.filter(f => !(trip.member_ids || []).includes(f.id));

              return (
                <div key={trip.id} className="bg-theme-secondary border border-theme-light rounded-xl overflow-hidden">
                  {/* Trip header */}
                  <button
                    onClick={() => handleExpandTrip(trip)}
                    className="w-full p-4 text-left flex justify-between items-center hover:bg-theme-tertiary transition"
                  >
                    <div>
                      <h3 className="text-theme-primary font-semibold">{trip.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {trip.start_date && (
                          <span className="text-xs text-theme-muted">
                            {trip.start_date}{trip.end_date ? ` → ${trip.end_date}` : ''}
                          </span>
                        )}
                        <span className="text-xs text-theme-faint">{(trip.member_ids || []).length} members</span>
                        {trip.description && <span className="text-xs text-theme-faint hidden sm:inline">— {trip.description}</span>}
                      </div>
                    </div>
                    <span className="text-theme-muted text-lg">{isExpanded ? '▾' : '▸'}</span>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-theme p-4 space-y-4">
                      {/* Members */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-semibold text-theme-muted">Members</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(trip.member_ids || []).map(memberId => {
                            const member = members[memberId];
                            return (
                              <div key={memberId} className="flex items-center gap-2 px-3 py-1.5 bg-theme-primary border border-theme rounded-lg text-sm">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member?.icon_color || '#888' }} />
                                <span className="text-theme-primary">{member?.name || 'Loading...'}</span>
                                {memberId === trip.owner_id && <span className="text-xs text-theme-faint">(owner)</span>}
                              </div>
                            );
                          })}
                          {isOwner && uninvitedFriends.length > 0 && (
                            <select
                              onChange={(e) => { if (e.target.value) handleInviteFriend(trip.id, e.target.value); e.target.value = ''; }}
                              className="px-3 py-1.5 bg-theme-tertiary border border-dashed border-theme rounded-lg text-theme-muted text-sm focus:outline-none"
                            >
                              <option value="">+ Invite friend...</option>
                              {uninvitedFriends.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Flights */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-semibold text-theme-muted">Flights ({flights.length})</h4>
                          <button
                            onClick={() => setShowAddFlight(trip.id)}
                            className="text-xs border border-theme text-theme-secondary px-2 py-1 rounded hover:bg-theme-tertiary transition"
                          >
                            + Add Flight
                          </button>
                        </div>
                        {flights.length > 0 ? (
                          <div className="space-y-2">
                            {flights.map(f => {
                              const flightMember = members[f.user_id];
                              return (
                                <div key={f.id} className="flex items-center gap-3 bg-theme-primary border border-theme rounded-lg p-3">
                                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: flightMember?.icon_color || '#888' }} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-theme-primary font-mono text-sm">{f.origin_code}</span>
                                      <span className="text-theme-faint">→</span>
                                      <span className="text-theme-primary font-mono text-sm">{f.destination_code}</span>
                                      <span className="text-theme-muted text-xs">{f.airline} {f.flight_number}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-theme-faint">{f.travel_date}</span>
                                      <span className="text-xs text-theme-muted">{flightMember?.name || 'Unknown'}</span>
                                      {f.seat_number && <span className="text-xs text-theme-faint">Seat {f.seat_number}</span>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-theme-faint">No flights added yet</p>
                        )}
                      </div>

                      {/* Delete */}
                      {isOwner && (
                        <div className="pt-2 border-t border-theme">
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="text-xs text-red-500 hover:text-red-400"
                          >
                            Delete Trip
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTripModal onClose={() => setShowCreate(false)} onCreate={handleCreateTrip} />
      )}

      {showAddFlight && (
        <AddTripFlightModal
          onClose={() => setShowAddFlight(null)}
          onAdd={(data) => handleAddFlight(showAddFlight, data)}
        />
      )}
    </div>
  );
}
