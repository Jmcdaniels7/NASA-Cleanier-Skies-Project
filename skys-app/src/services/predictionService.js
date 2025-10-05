// NOTE: Mock generator removed — predictions come exclusively from Open-Meteo.

// Convert PM2.5 concentration (µg/m3) to US EPA AQI using standard breakpoints
export function pm25ToAQI(conc) {
  if (conc == null || Number.isNaN(conc)) return null;
  const C = Number(conc);
  const breakpoints = [
    { Clow: 0.0, Chigh: 12.0, Ilow: 0, Ihigh: 50 },
    { Clow: 12.1, Chigh: 35.4, Ilow: 51, Ihigh: 100 },
    { Clow: 35.5, Chigh: 55.4, Ilow: 101, Ihigh: 150 },
    { Clow: 55.5, Chigh: 150.4, Ilow: 151, Ihigh: 200 },
    { Clow: 150.5, Chigh: 250.4, Ilow: 201, Ihigh: 300 },
    { Clow: 250.5, Chigh: 350.4, Ilow: 301, Ihigh: 400 },
    { Clow: 350.5, Chigh: 500.4, Ilow: 401, Ihigh: 500 },
  ];

  const bp = breakpoints.find(b => C >= b.Clow && C <= b.Chigh);
  if (!bp) return null;
  const { Clow, Chigh, Ilow, Ihigh } = bp;
  const aqi = ((Ihigh - Ilow) / (Chigh - Clow)) * (C - Clow) + Ilow;
  return Math.round(aqi);
}

export function aqiCategory(aqi) {
  if (aqi == null) return { label: 'No Data', color: 'rgba(255,255,255,0.6)' };
  if (aqi <= 50) return { label: 'Good', color: '#4caf50' };
  if (aqi <= 100) return { label: 'Moderate', color: '#ffb300' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#ff7043' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#f44336' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8e24aa' };
  return { label: 'Hazardous', color: '#6b0000' };
}

// Fetch hourly PM2.5 forecasts from Open-Meteo Air Quality API
// Returns same shape as generateMockPrediction: { predictions: [{ts, value, category}, ...] }
export async function fetchOpenMeteoPrediction({ lat = 39.7684, lon = -86.1581, hours = 48 } = {}) {
  // Build date range covering required hours
  const start = new Date();
  const end = new Date(start.getTime() + (hours - 1) * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  const start_date = ymd(start);
  const end_date = ymd(end);

  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('hourly', 'pm2_5');
  url.searchParams.set('start_date', start_date);
  url.searchParams.set('end_date', end_date);

  let resp;
  try {
    resp = await fetch(url.toString());
  } catch (err) {
    throw new Error('Network error fetching Open-Meteo: ' + (err.message || err));
  }

  if (!resp.ok) throw new Error('Open-Meteo returned ' + resp.status);
  const json = await resp.json();
  const times = (json.hourly && json.hourly.time) || [];
  const pm = (json.hourly && (json.hourly.pm2_5 || json.hourly.pm2_5)) || [];
  const preds = [];
  for (let i = 0; i < times.length && preds.length < hours; i++) {
    const ts = times[i];
    const value = pm[i] == null ? null : Number(pm[i]);
    const category = value == null ? 'No Data' : (value < 12 ? 'Good' : value < 35 ? 'Moderate' : 'Unhealthy');
    preds.push({ ts, value, category });
  }
  // If Open-Meteo returned fewer points than requested, pad using last value
  while (preds.length < hours) {
    const lastTs = preds.length ? preds[preds.length-1].ts : new Date().toISOString();
    const nextTs = new Date(new Date(lastTs).getTime() + 3600*1000).toISOString();
    const lastVal = preds.length ? preds[preds.length-1].value : null;
    preds.push({ ts: nextTs, value: lastVal, category: lastVal == null ? 'No Data' : (lastVal < 12 ? 'Good' : lastVal < 35 ? 'Moderate' : 'Unhealthy') });
  }

  return { predictions: preds };
}

// Main helper: fetch Open-Meteo predictions; throw on failure so callers can handle it.
export async function getPrediction(opts = {}) {
  const res = await fetchOpenMeteoPrediction(opts);
  if (!res || !res.predictions || res.predictions.length === 0) throw new Error('No prediction data from Open-Meteo');
  return res;
}
