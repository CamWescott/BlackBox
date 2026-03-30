// Common airports with coordinates for the map
const airports = [
  { code: 'ATL', name: 'Atlanta Hartsfield-Jackson', city: 'Atlanta', country: 'US', lat: 33.6407, lng: -84.4277 },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'US', lat: 33.9425, lng: -118.4081 },
  { code: 'ORD', name: "Chicago O'Hare", city: 'Chicago', country: 'US', lat: 41.9742, lng: -87.9073 },
  { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'US', lat: 32.8998, lng: -97.0403 },
  { code: 'DEN', name: 'Denver International', city: 'Denver', country: 'US', lat: 39.8561, lng: -104.6737 },
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'US', lat: 40.6413, lng: -73.7781 },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'US', lat: 37.6213, lng: -122.3790 },
  { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'US', lat: 47.4502, lng: -122.3088 },
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'US', lat: 36.0840, lng: -115.1537 },
  { code: 'MCO', name: 'Orlando International', city: 'Orlando', country: 'US', lat: 28.4312, lng: -81.3081 },
  { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'US', lat: 25.7959, lng: -80.2870 },
  { code: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', country: 'US', lat: 35.2140, lng: -80.9431 },
  { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'US', lat: 40.6895, lng: -74.1745 },
  { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', country: 'US', lat: 33.4373, lng: -112.0078 },
  { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'US', lat: 29.9902, lng: -95.3368 },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', country: 'US', lat: 44.8848, lng: -93.2223 },
  { code: 'BOS', name: 'Boston Logan International', city: 'Boston', country: 'US', lat: 42.3656, lng: -71.0096 },
  { code: 'DTW', name: 'Detroit Metropolitan', city: 'Detroit', country: 'US', lat: 42.2124, lng: -83.3534 },
  { code: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', country: 'US', lat: 39.8744, lng: -75.2424 },
  { code: 'LGA', name: 'LaGuardia', city: 'New York', country: 'US', lat: 40.7769, lng: -73.8740 },
  { code: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington', country: 'US', lat: 38.8512, lng: -77.0402 },
  { code: 'IAD', name: 'Washington Dulles International', city: 'Washington', country: 'US', lat: 38.9531, lng: -77.4565 },
  { code: 'SAN', name: 'San Diego International', city: 'San Diego', country: 'US', lat: 32.7338, lng: -117.1933 },
  { code: 'TPA', name: 'Tampa International', city: 'Tampa', country: 'US', lat: 27.9756, lng: -82.5333 },
  { code: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', country: 'US', lat: 30.1975, lng: -97.6664 },
  { code: 'BNA', name: 'Nashville International', city: 'Nashville', country: 'US', lat: 36.1263, lng: -86.6774 },
  { code: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', country: 'US', lat: 40.7899, lng: -111.9791 },
  { code: 'PDX', name: 'Portland International', city: 'Portland', country: 'US', lat: 45.5898, lng: -122.5951 },
  { code: 'HNL', name: 'Daniel K. Inouye International', city: 'Honolulu', country: 'US', lat: 21.3187, lng: -157.9224 },
  { code: 'RDU', name: 'Raleigh-Durham International', city: 'Raleigh', country: 'US', lat: 35.8801, lng: -78.7880 },
  // International
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'GB', lat: 51.4700, lng: -0.4543 },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.0097, lng: 2.5479 },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE', lat: 50.0379, lng: 8.5622 },
  { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'NL', lat: 52.3105, lng: 4.7683 },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'AE', lat: 25.2532, lng: 55.3657 },
  { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'JP', lat: 35.5494, lng: 139.7798 },
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'JP', lat: 35.7720, lng: 140.3929 },
  { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'SG', lat: 1.3644, lng: 103.9915 },
  { code: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'KR', lat: 37.4602, lng: 126.4407 },
  { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'AU', lat: -33.9461, lng: 151.1772 },
  { code: 'MEX', name: 'Mexico City International', city: 'Mexico City', country: 'MX', lat: 19.4363, lng: -99.0721 },
  { code: 'CUN', name: 'Cancun International', city: 'Cancun', country: 'MX', lat: 21.0365, lng: -86.8771 },
  { code: 'GRU', name: 'São Paulo–Guarulhos', city: 'São Paulo', country: 'BR', lat: -23.4356, lng: -46.4731 },
  { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'CA', lat: 43.6777, lng: -79.6248 },
  { code: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'CA', lat: 49.1967, lng: -123.1815 },
  { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino', city: 'Rome', country: 'IT', lat: 41.8003, lng: 12.2389 },
  { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid', country: 'ES', lat: 40.4983, lng: -3.5676 },
  { code: 'BCN', name: 'Barcelona–El Prat', city: 'Barcelona', country: 'ES', lat: 41.2974, lng: 2.0833 },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'TR', lat: 41.2753, lng: 28.7519 },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'TH', lat: 13.6900, lng: 100.7501 },
  { code: 'PEK', name: 'Beijing Capital International', city: 'Beijing', country: 'CN', lat: 40.0799, lng: 116.6031 },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'HK', lat: 22.3080, lng: 113.9185 },
  { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'IN', lat: 28.5562, lng: 77.1000 },
  { code: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'ZA', lat: -26.1392, lng: 28.2460 },
  { code: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'EG', lat: 30.1219, lng: 31.4056 },
  { code: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'PE', lat: -12.0219, lng: -77.1143 },
  { code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'CO', lat: 4.7016, lng: -74.1469 },
  { code: 'SCL', name: 'Arturo Merino Benítez International', city: 'Santiago', country: 'CL', lat: -33.3930, lng: -70.7858 },
  { code: 'EZE', name: 'Ministro Pistarini International', city: 'Buenos Aires', country: 'AR', lat: -34.8222, lng: -58.5358 },
  { code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'QA', lat: 25.2731, lng: 51.6081 },
  { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'DE', lat: 48.3537, lng: 11.7750 },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'CH', lat: 47.4647, lng: 8.5492 },
  { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'IE', lat: 53.4264, lng: -6.2499 },
  { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'DK', lat: 55.6180, lng: 12.6508 },
  { code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'NO', lat: 60.1976, lng: 11.1004 },
  { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'SE', lat: 59.6519, lng: 17.9186 },
  { code: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'FI', lat: 60.3172, lng: 24.9633 },
  { code: 'LIS', name: 'Lisbon Humberto Delgado', city: 'Lisbon', country: 'PT', lat: 38.7756, lng: -9.1354 },
  { code: 'ATH', name: 'Athens International', city: 'Athens', country: 'GR', lat: 37.9364, lng: 23.9445 },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'NZ', lat: -37.0082, lng: 174.7850 },
  { code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'KE', lat: -1.3192, lng: 36.9278 },
];

export default airports;

export function searchAirports(query) {
  const q = query.toLowerCase();
  return airports.filter(a =>
    a.code.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q)
  ).slice(0, 10);
}

export function getAirport(code) {
  return airports.find(a => a.code === code);
}
