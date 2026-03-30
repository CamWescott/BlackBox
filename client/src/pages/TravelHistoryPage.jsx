import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import GlobeMap from '../components/GlobeMap';

export default function TravelHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [flightData, friendData] = await Promise.all([
        api.get('/api/flights'),
        api.get('/api/friends'),
      ]);
      const flown = flightData.filter(f => f.status === 'flown');
      setFlights(flown);
      setAllFlights(flown);
      setFriends(friendData.filter(f => f.status === 'accepted'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = async (friend) => {
    const isSelected = selectedFriends.find(f => f.id === friend.id);
    if (isSelected) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
      // Remove friend's flights
      setAllFlights(prev => prev.filter(f => f._friendId !== friend.id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
      try {
        const friendFlights = await api.get(`/api/flights/friend/${friend.id}`);
        const flown = friendFlights
          .filter(f => f.status === 'flown')
          .map(f => ({
            ...f,
            _friendId: friend.id,
            _friendColor: friend.icon_color,
            _friendName: friend.name,
          }));
        setAllFlights(prev => [...prev, ...flown]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Merge flights - for shared flights, combine companion colors
  const displayFlights = allFlights.map(f => {
    if (f._friendColor) {
      return {
        ...f,
        companions: [
          ...(f.companions || []),
          { icon_color: f._friendColor, user_name: f._friendName }
        ]
      };
    }
    return f;
  });

  const stats = {
    totalFlights: flights.length,
    uniqueAirports: new Set([
      ...flights.map(f => f.origin_code),
      ...flights.map(f => f.destination_code)
    ]).size,
    uniqueAirlines: new Set(flights.map(f => f.airline)).size,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blackbox-dark flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blackbox-dark">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-widest">
          BLACK<span className="text-gray-400">BOX</span>
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm border border-gray-600 text-gray-300 rounded-lg hover:bg-blackbox-light transition"
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h2 className="text-xl font-bold text-white">Travel History</h2>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.totalFlights}</p>
            <p className="text-xs text-gray-500 mt-1">Flights Taken</p>
          </div>
          <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.uniqueAirports}</p>
            <p className="text-xs text-gray-500 mt-1">Airports Visited</p>
          </div>
          <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.uniqueAirlines}</p>
            <p className="text-xs text-gray-500 mt-1">Airlines Flown</p>
          </div>
        </div>

        {/* Friend filter */}
        {friends.length > 0 && (
          <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-2">Show travel companions on map:</p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blackbox-dark rounded-lg border border-gray-700">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.icon_color }} />
                <span className="text-sm text-white">You</span>
              </div>
              {friends.map(f => {
                const isSelected = selectedFriends.find(sf => sf.id === f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFriend(f)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition ${
                      isSelected
                        ? 'bg-blackbox-dark border-gray-500 text-white'
                        : 'bg-transparent border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.icon_color }} />
                    {f.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Map with flight paths */}
        {flights.length > 0 ? (
          <GlobeMap
            flights={displayFlights}
            height="500px"
            showPaths={true}
            userColor={user.icon_color}
          />
        ) : (
          <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">No travel history yet</p>
            <p className="text-gray-600 text-sm">Mark flights as "flown" to see them on the map</p>
          </div>
        )}

        {/* Flight list */}
        {flights.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">All Flights</h3>
            <div className="space-y-2">
              {flights.map(f => (
                <div key={f.id} className="bg-blackbox-gray border border-gray-800 rounded-lg p-3 flex items-center gap-4">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: user.icon_color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-sm">{f.origin_code}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-white font-mono text-sm">{f.destination_code}</span>
                      <span className="text-gray-500 text-xs ml-2">{f.airline} {f.flight_number}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-gray-500 text-xs">{f.travel_date}</span>
                      {f.seat_number && <span className="text-gray-600 text-xs">Seat {f.seat_number}</span>}
                      {f.companions && f.companions.length > 0 && (
                        <span className="text-gray-600 text-xs">
                          with {f.companions.map(c => c.user_name || c.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
