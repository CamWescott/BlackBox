import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import GlobeMap from '../components/GlobeMap';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function CalendarHeatmap({ monthlyHeatmap }) {
  if (!monthlyHeatmap || Object.keys(monthlyHeatmap).length === 0) return null;

  // Get year range
  const allMonths = Object.keys(monthlyHeatmap).sort();
  const startYear = parseInt(allMonths[0].substring(0, 4));
  const endYear = parseInt(allMonths[allMonths.length - 1].substring(0, 4));
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const maxCount = Math.max(...Object.values(monthlyHeatmap));

  const getColor = (count) => {
    if (!count) return 'bg-blackbox-light';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'bg-green-900';
    if (intensity <= 0.5) return 'bg-green-700';
    if (intensity <= 0.75) return 'bg-green-500';
    return 'bg-green-400';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Month labels */}
        <div className="flex">
          <div className="w-12" />
          {months.map(m => (
            <div key={m} className="flex-1 text-center text-xs text-gray-600">{m}</div>
          ))}
        </div>
        {/* Year rows */}
        {years.map(year => (
          <div key={year} className="flex items-center gap-1 mt-1">
            <div className="w-12 text-xs text-gray-500 text-right pr-2">{year}</div>
            {months.map((_, mi) => {
              const key = `${year}-${String(mi + 1).padStart(2, '0')}`;
              const count = monthlyHeatmap[key] || 0;
              return (
                <div
                  key={key}
                  className={`flex-1 h-6 rounded-sm ${getColor(count)} transition-colors`}
                  title={`${months[mi]} ${year}: ${count} flight${count !== 1 ? 's' : ''}`}
                />
              );
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-xs text-gray-600">Less</span>
          <div className="w-4 h-4 rounded-sm bg-blackbox-light" />
          <div className="w-4 h-4 rounded-sm bg-green-900" />
          <div className="w-4 h-4 rounded-sm bg-green-700" />
          <div className="w-4 h-4 rounded-sm bg-green-500" />
          <div className="w-4 h-4 rounded-sm bg-green-400" />
          <span className="text-xs text-gray-600">More</span>
        </div>
      </div>
    </div>
  );
}

export default function TravelHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [allFlights, setAllFlights] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [flightData, friendData, statsData] = await Promise.all([
        api.get('/api/flights'),
        api.get('/api/friends'),
        api.get('/api/flights/stats'),
      ]);
      const flown = flightData.filter(f => f.status === 'flown');
      setFlights(flown);
      setAllFlights(flown);
      setFriends(friendData.filter(f => f.status === 'accepted'));
      setStats(statsData);
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

        {/* Primary Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{stats.totalFlights}</p>
              <p className="text-xs text-gray-500 mt-1">Flights</p>
            </div>
            <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{stats.totalMiles.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Miles Flown</p>
            </div>
            <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{stats.totalKm.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Kilometers</p>
            </div>
            <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{stats.uniqueAirports}</p>
              <p className="text-xs text-gray-500 mt-1">Airports</p>
            </div>
            <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{stats.uniqueAirlines}</p>
              <p className="text-xs text-gray-500 mt-1">Airlines</p>
            </div>
          </div>
        )}

        {/* Insights Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Airports */}
            <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Most Visited Airports</h3>
              {stats.topAirports.length > 0 ? (
                <div className="space-y-2">
                  {stats.topAirports.map((a, i) => (
                    <div key={a.code} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-4">{i + 1}.</span>
                        <span className="text-white font-mono text-sm">{a.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-blackbox-light rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full"
                            style={{ width: `${(a.count / stats.topAirports[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-6 text-right">{a.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No data yet</p>
              )}
            </div>

            {/* Top Airlines */}
            <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Most Flown Airlines</h3>
              {stats.topAirlines.length > 0 ? (
                <div className="space-y-2">
                  {stats.topAirlines.map((a, i) => (
                    <div key={a.airline} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-4">{i + 1}.</span>
                        <span className="text-white text-sm">{a.airline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-blackbox-light rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full"
                            style={{ width: `${(a.count / stats.topAirlines[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-6 text-right">{a.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No data yet</p>
              )}
            </div>

            {/* Cabin Class & Yearly Breakdown */}
            <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">By Year</h3>
              {Object.keys(stats.yearlyFlights).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(stats.yearlyFlights)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([year, data]) => (
                      <div key={year} className="flex justify-between items-center">
                        <span className="text-white text-sm">{year}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{data.flights} flights</span>
                          <span className="text-xs text-gray-600">{Math.round(data.miles).toLocaleString()} mi</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No data yet</p>
              )}

              {/* Cabin class */}
              {stats.cabinCounts && Object.keys(stats.cabinCounts).length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">Cabin Class</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.cabinCounts).map(([cabin, count]) => (
                      <span key={cabin} className="text-xs bg-blackbox-light text-gray-300 px-2 py-1 rounded capitalize">
                        {cabin.replace('_', ' ')}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flight Calendar Heatmap */}
        {stats && stats.monthlyHeatmap && Object.keys(stats.monthlyHeatmap).length > 0 && (
          <div className="bg-blackbox-gray border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Flight Activity</h3>
            <CalendarHeatmap monthlyHeatmap={stats.monthlyHeatmap} />
          </div>
        )}

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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-mono text-sm">{f.origin_code}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-white font-mono text-sm">{f.destination_code}</span>
                      <span className="text-gray-500 text-xs ml-2">{f.airline} {f.flight_number}</span>
                      {f.cabin_class && f.cabin_class !== 'economy' && (
                        <span className="text-xs bg-blackbox-light text-gray-400 px-1.5 py-0.5 rounded capitalize">
                          {f.cabin_class.replace('_', ' ')}
                        </span>
                      )}
                      {f.trip_id && (
                        <span className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">Connecting</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-gray-500 text-xs">{f.travel_date}</span>
                      {f.seat_number && <span className="text-gray-600 text-xs">Seat {f.seat_number}</span>}
                      {f.companions && f.companions.length > 0 && (
                        <span className="text-gray-600 text-xs">
                          with {f.companions.map(c => c.user_name || c.name).join(', ')}
                        </span>
                      )}
                    </div>
                    {f.notes && (
                      <p className="text-xs text-gray-600 italic mt-0.5">{f.notes}</p>
                    )}
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
