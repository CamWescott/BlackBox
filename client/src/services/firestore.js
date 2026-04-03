import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Flights ──

export async function getFlights(userId) {
  const q = query(
    collection(db, 'flights'),
    where('user_id', '==', userId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.travel_date || '').localeCompare(a.travel_date || ''));
}

export async function addFlight(userId, flightData) {
  const docRef = await addDoc(collection(db, 'flights'), {
    ...flightData,
    user_id: userId,
    companions: flightData.companions || [],
    created_at: serverTimestamp(),
  });
  const snap = await getDoc(docRef);
  return { id: snap.id, ...snap.data() };
}

export async function addMultiLegTrip(userId, legs, companions = []) {
  const tripRef = await addDoc(collection(db, 'trips'), {
    user_id: userId,
    name: `${legs[0].origin_code} → ${legs[legs.length - 1].destination_code}`,
    created_at: serverTimestamp(),
  });

  const created = [];
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const docRef = await addDoc(collection(db, 'flights'), {
      user_id: userId,
      trip_id: tripRef.id,
      leg_order: i,
      airline: leg.airline,
      flight_number: leg.flight_number,
      origin_code: leg.origin_code,
      origin_name: leg.origin_name,
      origin_lat: leg.origin_lat,
      origin_lng: leg.origin_lng,
      destination_code: leg.destination_code,
      destination_name: leg.destination_name,
      destination_lat: leg.destination_lat,
      destination_lng: leg.destination_lng,
      seat_number: leg.seat_number || '',
      cabin_class: leg.cabin_class || 'economy',
      notes: leg.notes || '',
      travel_date: leg.travel_date,
      status: leg.status || 'booked',
      companions: companions,
      created_at: serverTimestamp(),
    });
    const snap = await getDoc(docRef);
    created.push({ id: snap.id, ...snap.data() });
  }
  return created;
}

export async function updateFlight(flightId, updates) {
  await updateDoc(doc(db, 'flights', flightId), updates);
  const snap = await getDoc(doc(db, 'flights', flightId));
  return { id: snap.id, ...snap.data() };
}

export async function deleteFlight(flightId) {
  await deleteDoc(doc(db, 'flights', flightId));
}

export async function updateFlightStatus(flightId, status) {
  await updateDoc(doc(db, 'flights', flightId), { status });
}

export async function getFriendFlights(friendId) {
  const q = query(
    collection(db, 'flights'),
    where('user_id', '==', friendId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.travel_date || '').localeCompare(a.travel_date || ''));
}

// ── Friends ──

export async function getFriends(userId) {
  // Two queries: one where user is requester, one where user is recipient
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, 'friendships'), where('user_id', '==', userId))),
    getDocs(query(collection(db, 'friendships'), where('friend_id', '==', userId))),
  ]);
  const allDocs = [...sentSnap.docs, ...receivedSnap.docs];

  const friendships = [];
  for (const d of allDocs) {
    const data = d.data();
    const isRequester = data.user_id === userId;
    const otherUserId = isRequester ? data.friend_id : data.user_id;

    // Get the other user's profile
    const userDoc = await getDoc(doc(db, 'users', otherUserId));
    const userData = userDoc.exists() ? userDoc.data() : {};

    friendships.push({
      friendship_id: d.id,
      id: otherUserId,
      name: userData.name || 'Unknown',
      email: userData.email || '',
      icon_color: userData.icon_color || '#22c55e',
      status: data.status,
      direction: isRequester ? 'sent' : 'received',
    });
  }
  return friendships;
}

export async function searchUsers(searchTerm, currentUserId) {
  // Firestore doesn't support full-text search, so we fetch all users
  // and filter client-side. For a large user base, consider Algolia/Typesense.
  const snap = await getDocs(collection(db, 'users'));
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u =>
      u.id !== currentUserId && (
        (u.name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      )
    )
    .slice(0, 10);
}

export async function sendFriendRequestById(userId, friendId) {
  if (friendId === userId) throw new Error("You can't add yourself");

  // Check for existing friendship
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, 'friendships'), where('user_id', '==', userId))),
    getDocs(query(collection(db, 'friendships'), where('friend_id', '==', userId))),
  ]);
  const allExisting = [...sentSnap.docs, ...receivedSnap.docs];
  const existing = allExisting.find(d => {
    const data = d.data();
    return (data.user_id === friendId || data.friend_id === friendId);
  });
  if (existing) throw new Error('Friend request already exists');

  await addDoc(collection(db, 'friendships'), {
    user_id: userId,
    friend_id: friendId,
    status: 'pending',
    created_at: serverTimestamp(),
  });
}

export async function sendFriendRequest(userId, friendEmail) {
  // Find user by email (case-insensitive)
  const q = query(collection(db, 'users'), where('email', '==', friendEmail.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('No user found with that email');

  const friendDoc = snap.docs[0];
  const friendId = friendDoc.id;

  if (friendId === userId) throw new Error("You can't add yourself");

  // Check for existing friendship
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, 'friendships'), where('user_id', '==', userId))),
    getDocs(query(collection(db, 'friendships'), where('friend_id', '==', userId))),
  ]);
  const allExisting = [...sentSnap.docs, ...receivedSnap.docs];
  const existing = allExisting.find(d => {
    const data = d.data();
    return (data.user_id === friendId || data.friend_id === friendId);
  });
  if (existing) throw new Error('Friend request already exists');

  await addDoc(collection(db, 'friendships'), {
    user_id: userId,
    friend_id: friendId,
    status: 'pending',
    created_at: serverTimestamp(),
  });
}

export async function acceptFriendRequest(friendshipId) {
  await updateDoc(doc(db, 'friendships', friendshipId), { status: 'accepted' });
}

export async function removeFriend(friendshipId) {
  await deleteDoc(doc(db, 'friendships', friendshipId));
}

// ── Users ──

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createUserProfile(userId, data) {
  await setDoc(doc(db, 'users', userId), {
    name: data.name,
    email: data.email.toLowerCase(),
    icon_color: '#22c55e',
    created_at: serverTimestamp(),
  });
}

export async function updateUserColor(userId, color) {
  await updateDoc(doc(db, 'users', userId), { icon_color: color });
}

// ── Group Trips ──

export async function getGroupTrips(userId) {
  // Trips where user is owner or member
  const [ownedSnap, memberSnap] = await Promise.all([
    getDocs(query(collection(db, 'group_trips'), where('owner_id', '==', userId))),
    getDocs(query(collection(db, 'group_trips'), where('member_ids', 'array-contains', userId))),
  ]);
  const allDocs = new Map();
  [...ownedSnap.docs, ...memberSnap.docs].forEach(d => allDocs.set(d.id, { id: d.id, ...d.data() }));
  return [...allDocs.values()].sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
}

export async function createGroupTrip(userId, tripData) {
  const docRef = await addDoc(collection(db, 'group_trips'), {
    owner_id: userId,
    name: tripData.name,
    description: tripData.description || '',
    start_date: tripData.start_date || '',
    end_date: tripData.end_date || '',
    member_ids: [userId],
    guest_names: tripData.guest_names || [],
    created_at: serverTimestamp(),
  });
  const snap = await getDoc(docRef);
  return { id: snap.id, ...snap.data() };
}

export async function addMemberToGroupTrip(tripId, userId) {
  const tripDoc = await getDoc(doc(db, 'group_trips', tripId));
  if (!tripDoc.exists()) throw new Error('Trip not found');
  const data = tripDoc.data();
  if (data.member_ids.includes(userId)) return;
  await updateDoc(doc(db, 'group_trips', tripId), {
    member_ids: [...data.member_ids, userId],
  });
}

export async function getGroupTripFlights(tripId) {
  const q = query(collection(db, 'flights'), where('group_trip_id', '==', tripId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.travel_date || '').localeCompare(b.travel_date || ''));
}

export async function addFlightToGroupTrip(userId, tripId, flightData) {
  const docRef = await addDoc(collection(db, 'flights'), {
    ...flightData,
    user_id: userId,
    group_trip_id: tripId,
    companions: flightData.companions || [],
    created_at: serverTimestamp(),
  });
  const snap = await getDoc(docRef);
  return { id: snap.id, ...snap.data() };
}

export async function deleteGroupTrip(tripId) {
  await deleteDoc(doc(db, 'group_trips', tripId));
}

export async function updateGroupTripGuests(tripId, guestNames) {
  await updateDoc(doc(db, 'group_trips', tripId), { guest_names: guestNames });
}

export async function linkFlightToGroupTrip(flightId, tripId) {
  await updateDoc(doc(db, 'flights', flightId), { group_trip_id: tripId });
  const snap = await getDoc(doc(db, 'flights', flightId));
  return { id: snap.id, ...snap.data() };
}

// ── Stats (computed client-side) ──

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeStats(flights) {
  const flown = flights.filter(f => f.status === 'flown');

  let totalMiles = 0;
  flown.forEach(f => {
    totalMiles += haversine(f.origin_lat, f.origin_lng, f.destination_lat, f.destination_lng);
  });

  const airportCounts = {};
  flown.forEach(f => {
    airportCounts[f.origin_code] = (airportCounts[f.origin_code] || 0) + 1;
    airportCounts[f.destination_code] = (airportCounts[f.destination_code] || 0) + 1;
  });
  const topAirports = Object.entries(airportCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  const airlineCounts = {};
  flown.forEach(f => {
    airlineCounts[f.airline] = (airlineCounts[f.airline] || 0) + 1;
  });
  const topAirlines = Object.entries(airlineCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([airline, count]) => ({ airline, count }));

  const yearlyFlights = {};
  flown.forEach(f => {
    const year = f.travel_date.substring(0, 4);
    if (!yearlyFlights[year]) yearlyFlights[year] = { flights: 0, miles: 0 };
    yearlyFlights[year].flights += 1;
    yearlyFlights[year].miles += haversine(f.origin_lat, f.origin_lng, f.destination_lat, f.destination_lng);
  });

  const monthlyHeatmap = {};
  flown.forEach(f => {
    const month = f.travel_date.substring(0, 7);
    monthlyHeatmap[month] = (monthlyHeatmap[month] || 0) + 1;
  });

  const cabinCounts = {};
  flown.forEach(f => {
    const cabin = f.cabin_class || 'economy';
    cabinCounts[cabin] = (cabinCounts[cabin] || 0) + 1;
  });

  return {
    totalFlights: flown.length,
    totalMiles: Math.round(totalMiles),
    totalKm: Math.round(totalMiles * 1.60934),
    uniqueAirports: new Set([...flown.map(f => f.origin_code), ...flown.map(f => f.destination_code)]).size,
    uniqueAirlines: new Set(flown.map(f => f.airline)).size,
    topAirports,
    topAirlines,
    yearlyFlights,
    monthlyHeatmap,
    cabinCounts,
  };
}
