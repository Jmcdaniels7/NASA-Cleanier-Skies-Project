// Meteomatics Weather API client for the React app
// - Builds request URLs following the Meteomatics pattern
// - Performs fetch() calls with Basic Auth using env vars
// - Returns raw JSON and provides a small helper to normalize timeseries

const BASE_URL = 'https://api.meteomatics.com';

/**
 * Build the Meteomatics time part of the URL.
 * If end and step are provided, produces an interval like:
 *   start--end:step (e.g. 2025-10-04T00:00:00Z--2025-10-07T00:00:00Z:PT1H)
 * Otherwise returns the single start time.
 */
function buildTimePart({ start, end, step }) {
  if (!start) throw new Error('start datetime is required');
  if (end && step) return `${start}--${end}:${step}`;
  return start;
}

/**
 * Build the full Meteomatics URL.
 * params: array of parameter strings like ['t_2m:C','precip_1h:mm']
 * location: either a pair { lat, lon } or a string (grid or bbox syntax)
 * format: 'json' | 'xml' | 'csv' | 'html' etc.
 */
export function buildMeteomaticsUrl({ start, end, step, params = [], location, format = 'json' }) {
  const timePart = buildTimePart({ start, end, step });

  if (!params || params.length === 0) {
    throw new Error('At least one parameter is required');
  }

  // Do not double-encode commas/colons used by Meteomatics in parameter spec -
  // but we should still encode the full segment for safety when appended to URL.
  const paramsPart = params.join(',');

  let locationPart;
  if (!location) throw new Error('location is required');
  if (typeof location === 'string') {
    locationPart = location;
  } else if (typeof location === 'object' && location.lat != null && location.lon != null) {
    locationPart = `${location.lat},${location.lon}`;
  } else {
    throw new Error('location must be a string or object with lat and lon');
  }

  // Final URL
  // We encode individual path segments to preserve Meteomatics syntax while keeping URL safe
  return `${BASE_URL}/${encodeURIComponent(timePart)}/${encodeURIComponent(paramsPart)}/${encodeURIComponent(locationPart)}/${encodeURIComponent(format)}`;
}

/**
 * Perform a fetch to Meteomatics and return parsed JSON.
 * Requires the following env vars to be set in the React app:
 *   REACT_APP_METEOMATICS_USER
 *   REACT_APP_METEOMATICS_PASSWORD
 */
export async function fetchMeteomaticsJson(options) {
  const url = buildMeteomaticsUrl(options);

  const user = process.env.REACT_APP_METEOMATICS_USER;
  const password = process.env.REACT_APP_METEOMATICS_PASSWORD;

  if (!user || !password) {
    throw new Error('Meteomatics credentials missing. Set REACT_APP_METEOMATICS_USER and REACT_APP_METEOMATICS_PASSWORD in your environment.');
  }

  // btoa is available in browsers; Node uses Buffer
  const basicAuth = (typeof btoa === 'function')
    ? btoa(`${user}:${password}`)
    : Buffer.from(`${user}:${password}`).toString('base64');

  const headers = {
    'Authorization': `Basic ${basicAuth}`,
    'Accept': 'application/json'
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const message = `Meteomatics API error: ${response.status} ${response.statusText} ${text}`;
    const err = new Error(message);
    err.status = response.status;
    err.statusText = response.statusText;
    throw err;
  }

  return response.json();
}

/**
 * Try to normalize a parameter timeseries from Meteomatics JSON responses.
 * The Meteomatics JSON schema can vary; this helper heuristically finds
 * a matching parameter block and returns an array of { date: ISO, value }.
 * If it cannot normalize, it returns { raw } where raw is the found block.
 */
export function parseParameterTimeseries(json, parameter) {
  if (!json) return { error: 'no data' };

  const arr = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : null);

  const pick = (entry) => {
    if (!entry) return null;
    // common shapes:
    // shape: { dates: [...], values: [...] }
    if (entry.dates && entry.values && Array.isArray(entry.dates) && Array.isArray(entry.values)) {
      return entry.dates.map((d, i) => ({ date: d, value: entry.values[i] }));
    }

    // shape: { dates: [{date, value}, ...] }
    if (entry.dates && Array.isArray(entry.dates) && entry.dates.length > 0 && entry.dates[0] && Object.prototype.hasOwnProperty.call(entry.dates[0], 'date') && Object.prototype.hasOwnProperty.call(entry.dates[0], 'value')) {
      return entry.dates.map(d => ({ date: d.date, value: d.value }));
    }

    // coordinates style: coordinates: [{ lat, lon, dates: [...datesObjects] }]
    if (entry.coordinates && Array.isArray(entry.coordinates) && entry.coordinates.length > 0) {
      const c = entry.coordinates[0];
      if (c.values && c.dates && Array.isArray(c.dates) && Array.isArray(c.values)) return c.dates.map((d, i) => ({ date: d, value: c.values[i] }));
      if (c.dates && Array.isArray(c.dates) && c.dates.length > 0 && c.dates[0] && Object.prototype.hasOwnProperty.call(c.dates[0], 'date')) {
        return c.dates.map(d => ({ date: d.date, value: d.value }));
      }
    }

    // time wrapper: { time: { dates: [...] }, values: [...] }
    if (entry.time && entry.time.dates && entry.values) {
      return entry.time.dates.map((d, i) => ({ date: d, value: entry.values[i] }));
    }

    return null;
  };

  if (arr && arr.length > 0) {
    let entry = null;
    if (parameter) {
      entry = arr.find(e => e.parameter === parameter || e.param === parameter || e.name === parameter || (e.jsonpath && e.jsonpath.includes(parameter)) );
    }
    if (!entry) entry = arr[0];

    const series = pick(entry);
    if (series) return { parameter: parameter || entry.parameter || entry.param, series };
    return { parameter: parameter || entry.parameter || entry.param, raw: entry };
  }

  return { raw: json };
}

// -------------------------
// Humidity parameter helpers
// -------------------------

const RH_MEASURES = ['mean', 'min', 'max'];
const RH_INTERVALS = ['1h', '2h', '3h', '6h', '12h', '24h'];

/**
 * Build instantaneous relative humidity parameter string.
 * level: '2m', '1000hPa', 'FL100', etc.
 * unit: 'p' (percent)
 */
export function relativeHumidityInstant(level = '2m', unit = 'p') {
  return `relative_humidity_${level}:${unit}`;
}

/**
 * Build interval relative humidity parameter string (mean/min/max over interval).
 * measure: 'mean' | 'min' | 'max'
 * level: '2m' | '850hPa' | etc.
 * interval: one of RH_INTERVALS (e.g., '3h')
 */
export function relativeHumidityInterval(measure, level = '2m', interval = '1h', unit = 'p') {
  if (!RH_MEASURES.includes(measure)) throw new Error(`invalid measure: ${measure}`);
  if (!RH_INTERVALS.includes(interval)) throw new Error(`invalid interval: ${interval}`);
  return `relative_humidity_${measure}_${level}_${interval}:${unit}`;
}

/**
 * Mean relative humidity over the last 10 years (2m only).
 */
export function relativeHumidity10yMean(unit = 'p') {
  return `relative_humidity_2m_10y_mean:${unit}`;
}

/**
 * Absolute humidity at 2m in g/m^3.
 */
export function absoluteHumidity2m(unit = 'gm3') {
  return `absolute_humidity_2m:${unit}`;
}

/**
 * Water vapor mixing ratio at a given level (e.g. '700hPa').
 */
export function mixingRatio(level = '700hPa', unit = 'kgkg') {
  return `mixing_ratio_${level}:${unit}`;
}

/**
 * Instantaneous water vapor pressure deficit at 2m.
 */
export function vaporPressureDeficitInstant(unit = 'hPa') {
  return `vapor_pressure_deficit_2m:${unit}`;
}

/**
 * Interval vapor pressure deficit at 2m (mean/min/max over interval)
 */
export function vaporPressureDeficitInterval(measure, interval = '1h', unit = 'hPa') {
  if (!RH_MEASURES.includes(measure)) throw new Error(`invalid measure: ${measure}`);
  if (!RH_INTERVALS.includes(interval)) throw new Error(`invalid interval: ${interval}`);
  return `vapor_pressure_deficit_${measure}_2m_${interval}:${unit}`;
}

/**
 * Convenience fetch that accepts either a single parameter string or an array of parameter strings.
 * options: { start, end, step, params, location, format }
 */
export async function fetchHumidity(options) {
  // accept single param string as options.params
  return fetchMeteomaticsJson(options);
}

const METEOMATICS = {
  buildMeteomaticsUrl,
  fetchMeteomaticsJson,
  parseParameterTimeseries,
  // humidity helpers
  relativeHumidityInstant,
  relativeHumidityInterval,
  relativeHumidity10yMean,
  absoluteHumidity2m,
  mixingRatio,
  vaporPressureDeficitInstant,
  vaporPressureDeficitInterval,
  fetchHumidity
};

export default METEOMATICS;
