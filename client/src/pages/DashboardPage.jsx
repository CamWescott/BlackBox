import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import GlobeMap from '../components/GlobeMap';
import ColorPicker from '../components/ColorPicker';
import AddFlightModal from '../components/AddFlightModal';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [friendMsg, setFriendMsg] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [flightData, friendData] = await Promise.all([
        api.get('/api/flights'),
        api.get('/api/friends'),
      ]);
      setFlights(flightData);
      setFriends(friendData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setFriendMsg('');
    try {
      await api.post('/api/friends/request', { email: friendEmail });
      setFriendMsg('Friend request sent!');
      setFriendEmail('');
      loadData();
    } catch (err) {
      setFriendMsg(err.message);
    }
  };

  const handleAcceptFriend = async (id) => {
    try {
      await api.patch(`/api/friends/${id}/accept`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFriend = async (id) => {
    try {
      await api.delete(`/api/friends/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFlight = async (id) => {
    try {
      await api.delete(`/api/flights/${id}`);
      setFlights(flights.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkFlown = async (id) => {
    try {
      await api.patch(`/api/flights/${id}/status`, { status: 'flown' });
      setFlights(flights.map(f => f.id === id ? { ...f, status: 'flown' } : f));
    } catch (err) {
      console.error(err);
    }
  };

  const upcomingFlights = flights.filter(f => f.status === 'booked');
  const pastFlights = flights.filter(f => f.status === 'flown');
  const pendingRequests = friends.filter(f => f.status === 'pending' && f.direction === 'received');
  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  return (
    <div className="min-h-screen bg-blackbox-dark">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-widest">
          BLACK<span className="text-gray-400">BOX</span>
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 text-sm border border-gray-600 text-gray-300 rounded-lg hover:bg-blackbox-light transition"
          >
            Travel History
          </button>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.icon_color }} />
            <span className="text-gray-300 text-sm">{user.name}</span>
          </div>
          <button onClick={logout} className="text-gray-500 hover:text-white text-sm">Logout</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Globe with flags */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Your World</h2>
          <GlobeMap flights={pastFlights} height="350px" showFlags={true} userColor={user.icon_color} />
        </section>

        {/* Profile & Color */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">Profile</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p><span className="text-gray-500">Name:</span> <span className="text-white">{user.name}</span></p>
              <p><span className="text-gray-500">Email:</span> <span className="text-white">{user.email}</span></p>
              <p><span className="text-gray-500">Flights:</span> <span className="text-white">{flights.length}</span></p>
              <p><span className="text-gray-500">Countries visited:</span> <span className="text-white">{new Set(pastFlights.map(f => f.destination_code.substring(0, 2))).size}</span></p>
            </div>
            <div className="mt-4">
              <ColorPicker currentColor={user.icon_color} />
            </div>
          </div>

          {/* Friends */}
          <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">Travel Companions</h3>
            <form onSubmit={handleAddFriend} className="flex gap-2 mb-3">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Add by email..."
                className="flex-1 px-3 py-2 bg-blackbox-dark border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none"
              />
              <button type="submit" className="px-3 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200">Add</button>
            </form>
            {friendMsg && <p className="text-xs text-gray-400 mb-2">{friendMsg}</p>}

            {/* Pending requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Pending Requests</p>
                {pendingRequests.map(f => (
                  <div key={f.friendship_id} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-300">{f.name} ({f.email})</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleAcceptFriend(f.friendship_id)} className="text-xs text-green-400 hover:text-green-300">Accept</button>
                      <button onClick={() => handleRemoveFriend(f.friendship_id)} className="text-xs text-red-400 hover:text-red-300">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Accepted friends */}
            {acceptedFriends.length > 0 ? (
              <div className="space-y-1">
                {acceptedFriends.map(f => (
                  <div key={f.friendship_id} className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.icon_color }} />
                      <span className="text-sm text-gray-300">{f.name}</span>
                    </div>
                    <button onClick={() => handleRemoveFriend(f.friendship_id)} className="text-xs text-gray-500 hover:text-red-400">Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600">No companions yet. Add friends by their email!</p>
            )}
          </div>
        </section>

        {/* Flights */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`text-sm font-medium pb-1 border-b-2 transition ${activeTab === 'upcoming' ? 'text-white border-white' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
              >
                Upcoming ({upcomingFlights.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`text-sm font-medium pb-1 border-b-2 transition ${activeTab === 'past' ? 'text-white border-white' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
              >
                Past ({pastFlights.length})
              </button>
            </div>
            <button
              onClick={() => setShowAddFlight(true)}
              className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              + Add Flight
            </button>
          </div>

          <div className="space-y-3">
            {(activeTab === 'upcoming' ? upcomingFlights : pastFlights).length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p className="text-lg mb-2">{activeTab === 'upcoming' ? 'No upcoming flights' : 'No past flights'}</p>
                <p className="text-sm">Click "Add Flight" to log your travels</p>
              </div>
            ) : (
              (activeTab === 'upcoming' ? upcomingFlights : pastFlights).map(flight => (
                <div key={flight.id} className="bg-blackbox-gray border border-gray-800 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white font-semibold">{flight.airline}</span>
                      <span className="text-gray-400 text-sm font-mono">{flight.flight_number}</span>
                      {flight.seat_number && (
                        <span className="text-xs bg-blackbox-light text-gray-300 px-2 py-0.5 rounded">Seat {flight.seat_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white font-mono">{flight.origin_code}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-white font-mono">{flight.destination_code}</span>
                      <span className="text-gray-500 ml-2">{flight.travel_date}</span>
                    </div>
                    {flight.companions && flight.companions.length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">Traveling with:</span>
                        {flight.companions.map((c, i) => (
                          <span key={i} className="text-xs text-gray-400">
                            {c.user_name || c.name}{c.seat_number ? ` (${c.seat_number})` : ''}
                            {i < flight.companions.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {flight.status === 'booked' && (
                      <button
                        onClick={() => handleMarkFlown(flight.id)}
                        className="text-xs text-green-400 hover:text-green-300 border border-green-800 px-2 py-1 rounded"
                      >
                        Mark Flown
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFlight(flight.id)}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-1 rounded"
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
            setFlights([flight, ...flights]);
          }}
        />
      )}
    </div>
  );
}
