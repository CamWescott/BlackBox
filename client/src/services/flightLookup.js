const RAPID_API_KEY = '***REMOVED-RAPIDAPI-KEY***';
const RAPID_API_HOST = 'aerodatabox.p.rapidapi.com';

// Map common airline names to ICAO codes for the API
const airlineToICAO = {
  'Delta': 'DAL',
  'United': 'UAL',
  'American Airlines': 'AAL',
  'Southwest': 'SWA',
  'JetBlue': 'JBU',
  'Alaska Airlines': 'ASA',
  'Spirit': 'NKS',
  'Frontier': 'FFT',
  'Hawaiian Airlines': 'HAL',
  'British Airways': 'BAW',
  'Lufthansa': 'DLH',
  'Air France': 'AFR',
  'Emirates': 'UAE',
  'Qatar Airways': 'QTR',
  'Singapore Airlines': 'SIA',
  'Qantas': 'QFA',
  'KLM': 'KLM',
  'Turkish Airlines': 'THY',
  'Cathay Pacific': 'CPA',
  'ANA': 'ANA',
  'JAL': 'JAL',
};

// Map airline names to IATA codes
const airlineToIATA = {
  'Delta': 'DL',
  'United': 'UA',
  'American Airlines': 'AA',
  'Southwest': 'WN',
  'JetBlue': 'B6',
  'Alaska Airlines': 'AS',
  'Spirit': 'NK',
  'Frontier': 'F9',
  'Hawaiian Airlines': 'HA',
  'British Airways': 'BA',
  'Lufthansa': 'LH',
  'Air France': 'AF',
  'Emirates': 'EK',
  'Qatar Airways': 'QR',
  'Singapore Airlines': 'SQ',
  'Qantas': 'QF',
  'KLM': 'KL',
  'Turkish Airlines': 'TK',
  'Cathay Pacific': 'CX',
  'ANA': 'NH',
  'JAL': 'JL',
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
