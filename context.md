# Project Context: Live Weather Dashboard

## What this is
A static, dependency-free weather dashboard: current conditions + 7-day forecast + city search. No backend, no API keys, no build step. Deploys as a static site (GitHub Pages, Netlify, Vercel, etc.).

## Stack
- Plain HTML / CSS / vanilla JS (no framework, no bundler)
- Weather + geocoding data from **Open-Meteo** (free, no API key):
  - Forecast: `https://api.open-meteo.com/v1/forecast`
  - Geocoding: `https://geocoding-api.open-meteo.com/v1/search`

## Files
- `index.html` — page structure (renamed from `weather-card.html` for GitHub Pages default routing)
- `styles.css` — all styling, including `.search-container.show` fade-in transition
- `script.js` — all logic (fetching, DOM updates, search, forecast rendering)
- `README.md` — setup/deploy instructions
- `.gitignore` — standard ignores

## Key implementation details
- **Units**: Fahrenheit + mph, set via `temperature_unit=fahrenheit&wind_speed_unit=mph` query params (not manually converted from Celsius).
- **Current weather** uses the `current=` param (not the legacy `current_weather=true`), fetching `temperature_2m, relative_humidity_2m, apparent_temperature, wind_speed_10m, weather_code`.
- **Forecast** uses `daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7` — this must be a single comma-separated `daily` param, not separate `daily_x=true` flags (that was a bug in an earlier draft).
- **Weather code → icon/description** mapping lives in `WEATHER_CODES` object in `script.js`, keyed by WMO code. `getWeatherInfo(code)` does a direct lookup and falls back to `❓ Unknown` for unrecognized codes (earlier draft had a broken fallback that silently mislabeled everything as "Clear Sky").
- **Default location**: New York City (`40.7128, -74.0060`) until the user searches a city.
- **City search**: geocodes via Open-Meteo geocoding API, updates `currentLat`/`currentLng`, then re-fetches both weather and forecast.
- **Search box toggle**: `toggleLocationSearch()` adds/removes the `.show` class (required for the CSS opacity/transform transition) in addition to flipping `display`.

## Known-fixed bugs (for reference, don't reintroduce)
1. `getWeatherInfo()` fallback using `Object.values(...).find(w => w.icon === '☀️' || true)` — the `|| true` always matched the first entry, mislabeling most weather as "Clear Sky."
2. `current_weather.weather_code` doesn't exist on the legacy API response (it's `weathercode`, no underscore) — solved by switching to the newer `current=` param instead.
3. Forecast params like `daily_weather_code=true` aren't valid Open-Meteo params — must use single `daily=weather_code,...`.
4. Missing humidity/wind/feels-like population in `loadWeather()` — now all four DOM fields (`condition`, `humidity`, `wind`, `feelsLike`) are set.

## Deployment
- Target: GitHub Pages, repo `econsmaestro/weather-dashboard`
- Settings → Pages → Source: `main` branch, root
- Expected live URL: `https://econsmaestro.github.io/weather-dashboard/`
- Status: deployed and live. `script.js`/`index.html` bugs listed under "Known-fixed bugs" below have actually been fixed and verified via a Playwright-driven smoke test (weather load, forecast load, search toggle animation, city search re-fetch).

## Possible next steps / ideas not yet built
- Loading spinners/skeleton states instead of "Loading..." text
- Metric/imperial toggle
- Geolocation (auto-detect user's location on first load instead of defaulting to NYC)
- Error toast/inline message instead of `alert()` for failed lookups
- Caching last-searched city in `localStorage` — **note**: not usable inside Claude artifacts (browser storage restriction), but fine once deployed as a real static site outside Claude
