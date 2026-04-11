const RAPID_API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPID_API_HOST = 'aerodatabox.p.rapidapi.com';

// Map airline names to IATA codes
const airlineToIATA = {
  'Aer Lingus': 'EI',
  'Aeromexico': 'AM',
  'Air Canada': 'AC',
  'Air France': 'AF',
  'Air India': 'AI',
  'Air New Zealand': 'NZ',
  'Alaska Airlines': 'AS',
  'Allegiant Air': 'G4',
  'American Airlines': 'AA',
  'ANA': 'NH',
  'Avianca': 'AV',
  'Breeze Airways': 'MX',
  'British Airways': 'BA',
  'Cape Air': '9K',
  'Cathay Pacific': 'CX',
  'Copa Airlines': 'CM',
  'Delta': 'DL',
  'EasyJet': 'U2',
  'Emirates': 'EK',
  'Ethiopian Airlines': 'ET',
  'Etihad Airways': 'EY',
  'EVA Air': 'BR',
  'Finnair': 'AY',
  'Frontier': 'F9',
  'Hawaiian Airlines': 'HA',
  'Iberia': 'IB',
  'Icelandair': 'FI',
  'ITA Airways': 'AZ',
  'JAL': 'JL',
  'JetBlue': 'B6',
  'KLM': 'KL',
  'Korean Air': 'KE',
  'LATAM': 'LA',
  'LOT Polish Airlines': 'LO',
  'Lufthansa': 'LH',
  'Norwegian': 'DY',
  'Qantas': 'QF',
  'Qatar Airways': 'QR',
  'Ryanair': 'FR',
  'SAS Scandinavian': 'SK',
  'Singapore Airlines': 'SQ',
  'Southwest': 'WN',
  'Spirit': 'NK',
  'Sun Country': 'SY',
  'Swiss International': 'LX',
  'TAP Air Portugal': 'TP',
  'Turkish Airlines': 'TK',
  'United': 'UA',
  'Virgin Atlantic': 'VS',
  'Vueling': 'VY',
  'WestJet': 'WS',
  'Wizz Air': 'W6',
};

/**
 * Look up a flight by number and date using AeroDataBox.
 * Returns { origin, destination } with airport objects, or null if not found.
 */
export async function lookupFlight(flightNumber, date) {
  // Clean up the flight number — strip spaces
  const cleanNumber = flightNumber.replace(/\s+/g, '').toUpperCase();

  if (!cleanNumber || !date) return null;

  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${cleanNumber}/${date}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPID_API_KEY,
      'x-rapidapi-host': RAPID_API_HOST,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Flight lookup failed');
  }

  const data = await response.json();

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // Take the first result
  const flight = data[0];

  const dep = flight.departure;
  const arr = flight.arrival;

  if (!dep?.airport || !arr?.airport) return null;

  return {
    origin: {
      code: dep.airport.iata || dep.airport.icao || '',
      name: dep.airport.name || '',
      city: dep.airport.municipalityName || dep.airport.name || '',
      lat: dep.airport.location?.lat || 0,
      lng: dep.airport.location?.lon || 0,
    },
    destination: {
      code: arr.airport.iata || arr.airport.icao || '',
      name: arr.airport.name || '',
      city: arr.airport.municipalityName || arr.airport.name || '',
      lat: arr.airport.location?.lat || 0,
      lng: arr.airport.location?.lon || 0,
    },
    airline: flight.airline?.name || null,
    aircraft: flight.aircraft?.model || '',
    departure_terminal: dep.terminal || '',
    departure_gate: dep.gate || '',
    departure_time: dep.scheduledTime?.local || dep.scheduledTime?.utc || '',
    arrival_terminal: arr.terminal || '',
    arrival_gate: arr.gate || '',
    arrival_time: arr.scheduledTime?.local || arr.scheduledTime?.utc || '',
    distance_miles: flight.greatCircleDistance?.mile || null,
    distance_km: flight.greatCircleDistance?.km || null,
  };
}

/**
 * Build the full flight number string from airline name + number.
 * e.g. ("Delta", "1234") -> "DL1234"
 * If the number already starts with an IATA code, return as-is.
 */
export function buildFlightNumber(airlineName, number) {
  const clean = number.replace(/\s+/g, '').toUpperCase();
  // If it already starts with letters (like DL1234), use as-is
  if (/^[A-Z]{2}\d/.test(clean)) return clean;

  const iata = airlineToIATA[airlineName];
  if (iata) return `${iata}${clean}`;

  return clean;
}
