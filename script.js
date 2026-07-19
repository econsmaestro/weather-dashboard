// Open-Meteo API Configuration (no key required!)
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';

let currentLat = 40.7128; // Default: New York City coordinates
let currentLng = -74.0060;
let currentUnit = 'fahrenheit'; // 'fahrenheit' or 'celsius'

// Complete Open-Meteo Weather Code Mapping to Icons & Descriptions
const WEATHER_CODES = {
 0: { icon:'☀️', desc:'Clear Sky' },
 1: { icon:'🌤️', desc:'Mainly Clear' },
 2: { icon:'⛅', desc:'Partly Cloudy' },
 3: { icon:'☁️', desc:'Overcast' },
 45:{icon:'🌫️',desc:'Foggy'},
 48:{icon:'🌫️',desc:'Rime Fog'},
 51:{icon:'💧',desc:'Light Drizzle'},
 53:{icon:'💧',desc:'Moderate Drizzle'},
 55:{icon:'💦',desc:'Dense Drizzle'},
 56:{icon:'🌧️',desc:'Light Freezing Drizzle'},
 57:{icon:'🌧️',desc:'Dense Freezing Drizzle'},
 61:{icon:'☔',desc:'Slight Rain'},
 63:{icon:'🌧️',desc:'Rain'},
 65:{icon:'⛈️',desc:'Heavy Rain'},
 66:{icon:'🌧️',desc:'Light Freezing Rain'},
 67:{icon:'🌧️',desc:'Heavy Freezing Rain'},
 71:{icon:'❄️',desc:'Light Snow'},
 73:{icon:'❄️',desc:'Moderate Snow'},
 75:{icon:'☃️',desc:'Heavy Snow'},
 77:{icon:'❄️',desc:'Snow Grains'},
 80:{icon:'🌦️',desc:'Slight Showers'},
 81:{icon:'🌨️',desc:'Showers'},
 82:{icon:'⛈️',desc:'Violent Showers'},
 85:{icon:'🌨️',desc:'Slight Snow Showers'},
 86:{icon:'🌨️',desc:'Heavy Snow Showers'},
 95:{icon:'⚡',desc:'Thunderstorm'},
 96:{icon:'❄️⚡',desc:'Thunderstorm with Slight Hail'},
 99:{icon:'❄️⚡',desc:'Thunderstorm with Heavy Hail'}
};

const UNKNOWN_WEATHER = { icon:'❓', desc:'Unknown' };

// Fetch with a couple of retries so a transient network blip (e.g. right
// after a page reload) doesn't surface as an error to the user.
async function fetchWithRetry(url, retries = 2, delayMs = 700) {
 for (let attempt = 0; attempt <= retries; attempt++) {
 try {
 const response = await fetch(url);
 if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);
 return response;
 } catch (error) {
 if (attempt === retries) throw error;
 await new Promise(resolve => setTimeout(resolve, delayMs));
 }
 }
}

// Get weather icon and description from code
function getWeatherInfo(code) {
 return WEATHER_CODES[code] || UNKNOWN_WEATHER;
}

// Switch between Fahrenheit/mph and Celsius/km/h
function setUnit(unit) {
 if (unit === currentUnit) return;
 currentUnit = unit;

 document.getElementById('unitF').classList.toggle('active', unit === 'fahrenheit');
 document.getElementById('unitC').classList.toggle('active', unit === 'celsius');

 loadWeather();
 loadForecast();
}

// Toggle location search visibility
function toggleLocationSearch() {
 const container = document.getElementById('locationSearchContainer');
 if (!container) return;

 const isShown = container.classList.toggle('show');
 if (isShown) {
 document.getElementById('cityInput').focus();
 }
}


// Search for city using Open-Meteo Geocoding API
async function searchCity() {
 const cityName = document.getElementById('cityInput').value.trim();
 if (!cityName) return;

 try {
 const response = await fetchWithRetry(`${GEOCODING_API}?name=${encodeURIComponent(cityName)}&count=1`);
 const data = await response.json();

 if (data.results && data.results.length > 0) {
 currentLat = parseFloat(data.results[0].latitude);
 currentLng = parseFloat(data.results[0].longitude);

 document.getElementById('city').textContent = `${data.results[0].name}, ${data.results[0].country || ''}`.trim();
 toggleLocationSearch(); // Hide search container after successful lookup

 loadWeather();
 loadForecast();

 } else {
 alert(`City "${cityName}" not found! Try another name.`);
 }

 } catch (error) {
 console.error('Geocoding error:', error);
 alert('Error searching for city.');
 }
}

// Load current weather data from Open-Meteo API
async function loadWeather() {
 try {
 const params = new URLSearchParams({
 latitude: currentLat,
 longitude: currentLng,
 current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code',
 temperature_unit: currentUnit,
 wind_speed_unit: currentUnit === 'fahrenheit' ? 'mph' : 'kmh',
 timezone: 'auto'
 });

 console.log(`Fetching weather for lat:${currentLat},lng:${currentLng}`); // Debug log

 const response = await fetchWithRetry(`${WEATHER_API}?${params}`);

 const data = await response.json();
 console.log('Weather API Response:',data.current); // Debug log

 if (data && data.current) {
 const weatherInfo = getWeatherInfo(data.current.weather_code);

 const unitLabel = currentUnit === 'fahrenheit' ? 'F' : 'C';
 const windLabel = currentUnit === 'fahrenheit' ? 'mph' : 'km/h';

 document.getElementById('temp').textContent = Math.round(data.current.temperature_2m);
 document.getElementById('tempUnit').textContent = unitLabel;
 document.getElementById('weatherIcon').textContent = weatherInfo.icon;
 document.getElementById('condition').textContent = weatherInfo.desc;
 document.getElementById('humidity').textContent = Math.round(data.current.relative_humidity_2m);
 document.getElementById('wind').textContent = Math.round(data.current.wind_speed_10m);
 document.getElementById('windUnit').textContent = windLabel;
 document.getElementById('feelsLike').textContent = Math.round(data.current.apparent_temperature);
 document.getElementById('feelsLikeUnit').textContent = unitLabel;

 if (data.current.time) {
 const localTime = new Date(data.current.time);
 const timeLabel = localTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
 document.getElementById('lastUpdated').textContent = `As of ${timeLabel} local time`;
 }

 } else { throw new Error('Invalid API response structure');}

 } catch (error) {
 console.error('Weather API error:',error);
 alert(`Error fetching weather: ${error.message}`);
 }
}

// Load forecast data from Open-Meteo API
async function loadForecast() {
 try {
 const params = new URLSearchParams({
 latitude: currentLat,
 longitude: currentLng,
 daily: 'weather_code,temperature_2m_max,temperature_2m_min',
 forecast_days: '7',
 temperature_unit: currentUnit,
 timezone: 'auto'
 });
 console.log(`Fetching forecast for lat:${currentLat},lng:${currentLng}`);

 // Fetch data
 const response = await fetchWithRetry(`${WEATHER_API}?${params}`);

 const data = await response.json();

 // ✅ SAFETY CHECKS ADDED HERE:
 console.log('Raw Forecast Response:', data);

 // Check for valid daily object
 if (!data.daily || !Array.isArray(data.daily.time)) {
 alert("No forecast available. Try a different location.");
 return;
 }

 const container = document.getElementById('forecastContainer');
 container.innerHTML = ''; // Clear previous cards

 for (let i=0; i < Math.min(7, data.daily.time.length); i++) {
 if (!data.daily.time[i]) continue;

 try {
 // Parse Y/M/D directly instead of new Date(dateString), which treats
 // date-only ISO strings as UTC midnight and can roll the weekday back
 // a day in timezones behind UTC.
 const [year, month, day] = data.daily.time[i].split('-').map(Number);
 const dateObj = new Date(year, month - 1, day);
 const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

 // Safely get max/min temps (already in the selected unit via temperature_unit param)
 const highTemp = data.daily.temperature_2m_max?.[i] ?? 0;
 const lowTemp = data.daily.temperature_2m_min?.[i] ?? 0;

 // Get weather code and icon
 const weatherCode = data.daily.weather_code?.[i] ?? 0;
 const forecastInfo = getWeatherInfo(weatherCode);

 container.innerHTML += `
 <div class="forecast-card">
 <div class="day-name">${dayName}</div>
 <span class="forecast-icon" id="weatherIcon-${i}">${forecastInfo.icon}</span>
 <div class="high-low"><span>${Math.round(highTemp)}°</span>/<span style="color:#888;">${Math.round(lowTemp)}°</span></div>
 </div>`;
 } catch (e) {
 console.error("Error processing forecast item:", e);
 }
 }

 } catch (error) {
 console.error('Forecast API error:', error);
 alert(`Error fetching forecast: ${error.message}`); }
}

// Initial load on page open:
loadWeather();
setTimeout(loadForecast, 1000); // Small delay to ensure weather loads first

// Add Enter key support for search input:
document.getElementById('cityInput')?.addEventListener('keypress', function(e) { if (e.key === 'Enter') searchCity();});
