import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getFlights, deleteFlight, updateFlightStatus,
  getFriends, sendFriendRequest, acceptFriendRequest, removeFriend,
} from '../services/firestore';
import GlobeMap from '../components/GlobeMap';
import ColorPicker from '../components/ColorPicker';
import AddFlightModal from '../components/AddFlightModal';
import Header from '../components/Header';

function exportToCSV(flights) {
  const headers = ['Date','Airline','Flight','Origin','Destination','Seat','Class','Notes','Status','Companions'];
  const rows = flights.map(f => [
    f.travel_date,
    f.airline,
    f.flight_number,
    f.origin_code,
    f.destination_code,
    f.seat_number || '',
    (f.cabin_class || 'economy').replace('_', ' '),
    (f.notes || '').replace(/"/g, '""'),
    f.status,
    (f.companions || []).map(c => c.user_name || c.name).join('; '),
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blackbox-flights-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [flights, setFlights] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [friendMsg, setFriendMsg] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAirline, setFilterAirline] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const flightData = await getFlights(user.id);
      setFlights(flightData);
    } catch (err) {
      console.error('Failed to load flights:', err);
    }
    try {
      const friendData = await getFriends(user.id);
      setFriends(friendData);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setFriendMsg('');
    try {
      await sendFriendRequest(user.id, friendEmail);
      setFriendMsg('Friend request sent!');
      setFriendEmail('');
      loadData();
    } catch (err) {
      setFriendMsg(err.message);
    }
  };

  const handleAcceptFriend = async (id) => {
    try {
      await acceptFriendRequest(id);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleRemoveFriend = async (id) => {
    try {
      await removeFriend(id);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteFlight = async (id) => {
    try {
      await deleteFlight(id);
      setFlights(flights.filter(f => f.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleMarkFlown = async (id) => {
    try {
      await updateFlightStatus(id, 'flown');
      setFlights(flights.map(f => f.id === id ? { ...f, status: 'flown' } : f));
    } catch (err) { console.error(err); }
  };

  const upcomingFlights = flights.filter(f => f.status === 'booked');
  const pastFlights = flights.filter(f => f.status === 'flown');
  const pendingRequests = friends.filter(f => f.status === 'pending' && f.direction === 'received');
  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  const allAirlines = [...new Set(flights.map(f => f.airline))].sort();

  const filterFlights = (list) => {
    return list.filter(f => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        f.airline.toLowerCase().includes(q) ||
        f.flight_number.toLowerCase().includes(q) ||
        f.origin_code.toLowerCase().includes(q) ||
        f.destination_code.toLowerCase().includes(q) ||
        f.travel_date.includes(q) ||
        (f.notes || '').toLowerCase().includes(q);
      const matchesAirline = !filterAirline || f.airline === filterAirline;
      return matchesSearch && matchesAirline;
    });
  };

  const displayFlights = filterFlights(activeTab === 'upcoming' ? upcomingFlights : pastFlights);

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Globe with flags */}
        <section>
          <h2 className="text-lg font-semibold text-theme-primary mb-3">Your World</h2>
          <GlobeMap flights={pastFlights} height="300px" showFlags={true} userColor={user.icon_color} theme={theme} />
        </section>

        {/* Profile & Friends */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-theme-secondary border border-theme-light rounded-xl p-4 sm:p-5">
            <h3 className="text-theme-primary font-semibold mb-3">Profile</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-theme-muted">Name:</span> <span className="text-theme-primary">{user.name}</span></p>
              <p><span className="text-theme-muted">Email:</span> <span className="text-theme-primary">{user.email}</span></p>
              <p><span className="text-theme-muted">Flights:</span> <span className="text-theme-primary">{flights.length}</span></p>
            </div>
            <div className="mt-4">
              <ColorPicker currentColor={user.icon_color} />
            </div>
          </div>

          <div className="bg-theme-secondary border border-theme-light rounded-xl p-4 sm:p-5">
            <h3 className="text-theme-primary font-semibold mb-3">Travel Companions</h3>
            <form onSubmit={handleAddFriend} className="flex gap-2 mb-3">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Add by email..."
                className="flex-1 px-3 py-2 bg-theme-primary border border-theme rounded text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
              />
              <button type="submit" className="px-3 py-2 bg-theme-primary text-theme-primary text-sm font-medium rounded border border-theme hover:bg-theme-tertiary">Add</button>
            </form>
            {friendMsg && <p className="text-xs text-theme-muted mb-2">{friendMsg}</p>}

            {pendingRequests.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-theme-faint mb-1">Pending Requests</p>
                {pendingRequests.map(f => (
                  <div key={f.friendship_id} className="flex justify-between items-center py-1">
                    <span className="text-sm text-theme-secondary">{f.name} ({f.email})</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleAcceptFriend(f.friendship_id)} className="text-xs text-green-500 hover:text-green-400">Accept</button>
                      <button onClick={() => handleRemoveFriend(f.friendship_id)} className="text-xs text-red-500 hover:text-red-400">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {acceptedFriends.length > 0 ? (
              <div className="space-y-1">
                {acceptedFriends.map(f => (
                  <div key={f.friendship_id} className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.icon_color }} />
                      <span className="text-sm text-theme-secondary">{f.name}</span>
                    </div>
                    <button onClick={() => handleRemoveFriend(f.friendship_id)} className="text-xs text-theme-faint hover:text-red-400">Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-theme-faint">No companions yet. Add friends by their email!</p>
            )}
          </div>
        </section>

        {/* Flights */}
        <section>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`text-sm font-medium pb-1 border-b-2 transition ${activeTab === 'upcoming' ? 'text-theme-primary border-current' : 'text-theme-muted border-transparent hover:text-theme-secondary'}`}
              >
                Upcoming ({upcomingFlights.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`text-sm font-medium pb-1 border-b-2 transition ${activeTab === 'past' ? 'text-theme-primary border-current' : 'text-theme-muted border-transparent hover:text-theme-secondary'}`}
              >
                Past ({pastFlights.length})
              </button>
            </div>
            <div className="flex gap-2">
              {flights.length > 0 && (
                <button
                  onClick={() => exportToCSV(flights)}
                  className="px-3 py-2 text-xs sm:text-sm border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition"
                >
                  Export CSV
                </button>
              )}
              <button
                onClick={() => setShowAddFlight(true)}
                className="px-3 py-2 bg-theme-primary text-theme-primary text-xs sm:text-sm font-semibold rounded-lg border border-theme hover:bg-theme-tertiary transition"
              >
                + Add Flight
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flights (airline, route, date, notes...)"
              className="flex-1 px-3 py-2 bg-theme-secondary border border-theme rounded-lg text-theme-primary text-sm placeholder-gray-500 focus:outline-none"
            />
            {allAirlines.length > 1 && (
              <select
                value={filterAirline}
                onChange={(e) => setFilterAirline(e.target.value)}
                className="px-3 py-2 bg-theme-secondary border border-theme rounded-lg text-theme-primary text-sm focus:outline-none"
              >
                <option value="">All Airlines</option>
                {allAirlines.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
          </div>

          {/* Flight list */}
          <div className="space-y-3">
            {displayFlights.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-theme-muted mb-2">
                  {searchQuery || filterAirline ? 'No flights match your search' : activeTab === 'upcoming' ? 'No upcoming flights' : 'No past flights'}
                </p>
                <p className="text-sm text-theme-faint">
                  {searchQuery || filterAirline ? 'Try a different search term' : 'Click "Add Flight" to log your travels'}
                </p>
              </div>
            ) : (
              displayFlights.map(flight => (
                <div key={flight.id} className="bg-theme-secondary border border-theme-light rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                      <span className="text-theme-primary font-semibold text-sm sm:text-base">{flight.airline}</span>
                      <span className="text-theme-muted text-xs sm:text-sm font-mono">{flight.flight_number}</span>
                      {flight.seat_number && (
                        <span className="text-xs bg-theme-tertiary text-theme-secondary px-2 py-0.5 rounded">Seat {flight.seat_number}</span>
                      )}
                      {flight.cabin_class && flight.cabin_class !== 'economy' && (
                        <span className="text-xs bg-theme-tertiary text-theme-secondary px-2 py-0.5 rounded capitalize">
                          {flight.cabin_class.replace('_', ' ')}
                        </span>
                      )}
                      {flight.trip_id && (
                        <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">Connecting</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-theme-primary font-mono">{flight.origin_code}</span>
                      <span className="text-theme-faint">→</span>
                      <span className="text-theme-primary font-mono">{flight.destination_code}</span>
                      <span className="text-theme-muted ml-2 text-xs sm:text-sm">{flight.travel_date}</span>
                    </div>
                    {flight.notes && (
                      <p className="text-xs text-theme-muted italic mt-1 truncate">{flight.notes}</p>
                    )}
                    {flight.companions && flight.companions.length > 0 && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-theme-faint">with:</span>
                        {flight.companions.map((c, i) => (
                          <span key={i} className="text-xs text-theme-muted">
                            {c.user_name || c.name}{c.seat_number ? ` (${c.seat_number})` : ''}
                            {i < flight.companions.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    {flight.status === 'booked' && (
                      <button
                        onClick={() => handleMarkFlown(flight.id)}
                        className="text-xs text-green-500 hover:text-green-400 border border-green-800 px-2 py-1 rounded"
                      >
                        Mark Flown
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFlight(flight.id)}
                      className="text-xs text-red-500 hover:text-red-400 border border-red-800 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {showAddFlight && (
        <AddFlightModal
          onClose={() => setShowAddFlight(false)}
          onFlightAdded={(flight) => {
            if (Array.isArray(flight)) {
              setFlights([...flight, ...flights]);
            } else {
              setFlights([flight, ...flights]);
            }
          }}
          friends={acceptedFriends}
        />
      )}
    </div>
  );
}
