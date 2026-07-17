// Open-Meteo API Configuration (no key required!)
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';

let currentLat = 40.7128; // Default: New York City coordinates
let currentLng = -74.0060;

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
 61:{icon:'☔',desc:'Slight Rain'}, 
 63:{icon:'🌧️',desc:'Rain'}, 
 65:{icon:'⛈️',desc:'Heavy Rain'},
 71:{icon:'❄️',desc:'Light Snow'}, 
 73:{icon:'❄️',desc:'Moderate Snow'}, 
 75:{icon:'☃️',desc:'Heavy Snow'},
 80:{icon:'🌦️',desc:'Slight Showers'}, 
 81:{icon:'🌨️',desc:'Showers'}, 
 82:{icon:'⛈️',desc:'Violent Showers'},
 95:{icon:'⚡',desc:'Thunderstorm'}, 
 96:{icon:'❄️⚡',desc:'Hail & Thunderstorm'}
};

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(tempC) { 
 return Math.round((tempC * 9/5) + 32); 
}

// Get weather icon and description from code (FIXED)
function getWeatherInfo(code) {
 // Handle ranges:
 if ([45, 48].includes(code)) return WEATHER_CODES[45];
 if ([51,67].includes(code)) return code >= 60 ? WEATHER_CODES[63] : WEATHER_CODES[53];

 // Thunderstorms (95-99)
 const isThunderstorm = [95, 96, 98, 99].some(c => c === code);
 if (isThunderstorm) return WEATHER_CODES[95]; 

 // Default fallback
 const weatherInfo = Object.values(WEATHER_CODES).find(w => w.icon === '☀️' || true);
 if (!weatherInfo) {
 console.log('Weather code not found:', code); 
 return WEATHER_CODES[0];
 }

 return weatherInfo;
}

// Toggle location search visibility
function toggleLocationSearch() { 
 const container = document.getElementById('locationSearchContainer');
 if (!container) return;

 // If hidden, show it; otherwise hide.
 container.style.display = container.style.display === 'none' ? 'flex' : 'none';
 if (container.style.display !== 'none') {
 document.getElementById('cityInput').focus(); 
 }
}


// Search for city using Open-Meteo Geocoding API
async function searchCity() {
 const cityName = document.getElementById('cityInput').value.trim();
 if (!cityName) return;

 try {
 const response = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(cityName)}&count=1`);
 const data = await response.json();

 if (data.results && data.results.length > 0) {
 currentLat = parseFloat(data.results[0].latitude);
 currentLng = parseFloat(data.results[0].longitude);

 document.getElementById('city').textContent = `${data.results[0].name}, ${data.results[0].country || ''}`.trim();
 toggleLocationSearch(); // Hide search container after successful lookup

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
 const params = new URLSearchParams({ latitude: currentLat, longitude: currentLng, current_weather:true });

 console.log(`Fetching weather for lat:${currentLat},lng:${currentLng}`); // Debug log

 const response = await fetch(`${WEATHER_API}?${params}`);

 if (!response.ok) { 
 throw new Error(`API request failed with status: ${response.status}`);
 }

 const data = await response.json();
 console.log('Weather API Response:',data.current_weather); // Debug log

 if (data && data.current_weather) {
 document.getElementById('temp').textContent = celsiusToFahrenheit(data.current_weather.temperature);

 const weatherInfo = getWeatherInfo(data.current_weather.weather_code);
 document.getElementById('weatherIcon').textContent = weatherInfo.icon;

 } else { throw new Error('Invalid API response structure');}

 } catch (error) { 
 console.error('Weather API error:',error); 
 alert(`Error fetching weather: ${error.message}`);
 }
}

// Load forecast data from Open-Meteo API
async function loadForecast() { 
 try {
 const params = new URLSearchParams({ latitude: currentLat, longitude: currentLng, daily_weather_code:true,daily_temperature_2m_max:'true',daily_temperature_2m_min:'true' });
 console.log(`Fetching forecast for lat:${currentLat},lng:${currentLng}`);

 // Fetch data
 const response = await fetch(`${WEATHER_API}?${params}`);
 if (!response.ok) { 
 throw new Error(`Forecast API request failed with status: ${response.status}`); }

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
 const dateObj = new Date(data.daily.time[i]);
 const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

 // Safely get max/min temps
 const highTempC = data.daily.temperature_2m_max?.[i] || 0;
 const lowTempC = data.daily.temperature_2m_min?.[i] || 0;

 const highTempF = celsiusToFahrenheit(highTempC);
 const lowTempF = celsiusToFahrenheit(lowTempC);

 // Get weather code and icon
 const weatherCode = data.daily.weather_code?.[i] || 0;
 const forecastInfo = getWeatherInfo(weatherCode); 

 container.innerHTML += `
 <div class="forecast-card">
 <div class="day-name">${dayName}</div>
 <span class="forecast-icon" id="weatherIcon-${i}">${forecastInfo.icon}</span>
 <div class="high-low"><span>${Math.round(highTempF)}°</span>/<span style="color:#888;">${Math.round(lowTempF)}°</span></div>
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