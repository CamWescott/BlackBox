import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFriends, getFriendFlights, getFlights } from '../services/firestore';
import Header from '../components/Header';

export default function FeedPage() {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [friends, setFriends] = useState([]);
  const [myFlights, setMyFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const [friendData, myFlightData] = await Promise.all([
        getFriends(user.id),
        getFlights(user.id),
      ]);
      const accepted = friendData.filter(f => f.status === 'accepted');
      setFriends(accepted);
      setMyFlights(myFlightData);

      // Fetch flights from all friends
      const allFeedItems = [];
      for (const friend of accepted) {
        try {
          const flights = await getFriendFlights(friend.id);
          flights.forEach(f => {
            allFeedItems.push({
              ...f,
              friendName: friend.name,
              friendColor: friend.icon_color,
              friendId: friend.id,
            });
          });
        } catch (err) {
          console.error(`Failed to load flights for ${friend.name}:`, err);
        }
      }

      // Sort by date, newest first
      allFeedItems.sort((a, b) => (b.travel_date || '').localeCompare(a.travel_date || ''));
      setFeedItems(allFeedItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compute travel compatibility for selected friend
  const getCompatibility = (friend) => {
    const friendFlights = feedItems.filter(f => f.friendId === friend.id && f.status === 'flown');
    const myFlown = myFlights.filter(f => f.status === 'flown');

    const myAirports = new Set();
    myFlown.forEach(f => { myAirports.add(f.origin_code); myAirports.add(f.destination_code); });

    const friendAirports = new Set();
    friendFlights.forEach(f => { friendAirports.add(f.origin_code); friendAirports.add(f.destination_code); });

    const commonAirports = [...myAirports].filter(a => friendAirports.has(a));

    const myAirlines = new Set(myFlown.map(f => f.airline));
    const friendAirlines = new Set(friendFlights.map(f => f.airline));
    const commonAirlines = [...myAirlines].filter(a => friendAirlines.has(a));

    // Shared flights (same route + same date)
    const sharedFlights = myFlown.filter(mf =>
      friendFlights.some(ff =>
        ff.origin_code === mf.origin_code &&
        ff.destination_code === mf.destination_code &&
        ff.travel_date === mf.travel_date
      )
    );

    return {
      commonAirports,
      commonAirlines,
      sharedFlights,
      myTotal: myFlown.length,
      friendTotal: friendFlights.length,
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr + 'T00:00:00');
    const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-theme-muted">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <h2 className="text-xl font-bold text-theme-primary">Friend Activity</h2>

        {/* Travel Compatibility Section */}
        {friends.length > 0 && (
          <div className="bg-theme-secondary border border-theme-light rounded-xl p-4">
            <h3 className="text-sm font-semibold text-theme-muted mb-3">Compare Travels</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {friends.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFriend(selectedFriend?.id === f.id ? null : f)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition ${
                    selectedFriend?.id === f.id
                      ? 'bg-theme-tertiary border-theme text-theme-primary'
                      : 'bg-transparent border-theme text-theme-muted hover:text-theme-secondary'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.icon_color }} />
                  {f.name}
                </button>
              ))}
            </div>

            {selectedFriend && (() => {
              const compat = getCompatibility(selectedFriend);
              return (
                <div className="space-y-3 border-t border-theme pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedFriend.icon_color }} />
                    <span className="text-theme-primary font-medium">{selectedFriend.name}</span>
                    <span className="text-theme-faint text-xs">({compat.friendTotal} flights)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-theme-primary border border-theme rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-theme-primary">{compat.commonAirports.length}</p>
                      <p className="text-xs text-theme-muted mt-1">Common Airports</p>
                      {compat.commonAirports.length > 0 && (
                        <p className="text-xs text-theme-faint mt-1 truncate">
                          {compat.commonAirports.slice(0, 5).join(', ')}{compat.commonAirports.length > 5 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    <div className="bg-theme-primary border border-theme rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-theme-primary">{compat.commonAirlines.length}</p>
                      <p className="text-xs text-theme-muted mt-1">Common Airlines</p>
                      {compat.commonAirlines.length > 0 && (
                        <p className="text-xs text-theme-faint mt-1 truncate">
                          {compat.commonAirlines.slice(0, 3).join(', ')}{compat.commonAirlines.length > 3 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    <div className="bg-theme-primary border border-theme rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-theme-primary">{compat.sharedFlights.length}</p>
                      <p className="text-xs text-theme-muted mt-1">Same Flight & Date</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Flight Feed */}
        {feedItems.length > 0 ? (
          <div className="space-y-3">
            {feedItems.map((item, i) => (
              <div key={`${item.id}-${i}`} className="bg-theme-secondary border border-theme-light rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.friendColor }} />
                  <span className="text-theme-primary font-medium text-sm">{item.friendName}</span>
                  <span className="text-theme-faint text-xs ml-auto">{timeAgo(item.travel_date)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-theme-primary font-mono text-lg">{item.origin_code}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-px bg-theme-muted" />
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-theme-muted" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                      <div className="w-8 h-px bg-theme-muted" />
                    </div>
                    <span className="text-theme-primary font-mono text-lg">{item.destination_code}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-theme-secondary text-sm">{item.airline}</span>
                  <span className="text-theme-muted text-xs font-mono">{item.flight_number}</span>
                  <span className="text-theme-faint text-xs">{formatDate(item.travel_date)}</span>
                  {item.cabin_class && item.cabin_class !== 'economy' && (
                    <span className="text-xs bg-theme-tertiary text-theme-secondary px-2 py-0.5 rounded capitalize">
                      {item.cabin_class.replace('_', ' ')}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    item.status === 'flown'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-blue-900/30 text-blue-400'
                  }`}>
                    {item.status === 'flown' ? 'Flown' : 'Upcoming'}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-theme-muted italic mt-2">{item.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-theme-secondary border border-theme-light rounded-xl p-12 text-center">
            {friends.length === 0 ? (
              <>
                <p className="text-theme-muted text-lg mb-2">No friends yet</p>
                <p className="text-theme-faint text-sm">Add friends on the Dashboard to see their flights here</p>
              </>
            ) : (
              <>
                <p className="text-theme-muted text-lg mb-2">No friend flights yet</p>
                <p className="text-theme-faint text-sm">Your friends haven't logged any flights yet</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
