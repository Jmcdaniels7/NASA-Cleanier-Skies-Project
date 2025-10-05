import React, { useState, useEffect } from 'react';
import Meteomatics from '../services/meteomaticsService';

export default function MeteomaticsDemo({ lat, lon }) {
  const [loading, setLoading] = useState(false);
  const [humidity, setHumidity] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [rawWarnings, setRawWarnings] = useState(null);
  const [warnings, setWarnings] = useState(null); // kept for compatibility if other code references it
  const [windData, setWindData] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);
  const [error, setError] = useState(null);

  const fetchHumidity = async (location) => {
    setLoading(true);
    setError(null);
    setHumidity(null);
    setTimestamp(null);

    try {
      const param = Meteomatics.relativeHumidityInstant('2m');
      const options = {
        start: new Date().toISOString(),
        params: [param],
        location,
        format: 'json'
      };

      const json = await Meteomatics.fetchMeteomaticsJson(options);
      const parsed = Meteomatics.parseParameterTimeseries(json, param);

      // parsed.series is an array of {date,value}
      if (parsed && Array.isArray(parsed.series) && parsed.series.length > 0) {
        const latest = parsed.series[parsed.series.length - 1];
        setHumidity(latest.value);
        setTimestamp(latest.date);
      } else if (parsed && parsed.raw) {
        setError('No timeseries data returned');
      } else {
        setError('No data');
      }
      // fetch only the three parameters we care about: speed, direction, gusts
      const windParams = [
        Meteomatics.windSpeed('10m', 'ms'),
        Meteomatics.windDirection('10m'),
        Meteomatics.windGusts('10m', '3h', 'ms')
      ];

      const windDataMap = {};
      for (const p of windParams) windDataMap[p] = null;

      try {
        const now = new Date();
        const endIso = now.toISOString();
        const startIso = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
        const windOptions = {
          start: startIso,
          end: endIso,
          step: 'PT1H',
          params: windParams,
          location,
          format: 'json'
        };

        try {
          const windUrl = Meteomatics.buildMeteomaticsUrl(windOptions);
          setLastRequest({ url: windUrl, time: new Date().toISOString() });
        } catch (e) {
          setLastRequest({ url: 'build-url-failed', error: String(e), time: new Date().toISOString() });
        }

        const windJson = await Meteomatics.fetchMeteomaticsJson(windOptions);
        setRawWarnings(windJson);
        console.debug('Meteomatics wind raw:', windJson);

        if (windJson && Array.isArray(windJson.data) && windJson.data.length > 0) {
          for (const entry of windJson.data) {
            const key = entry.parameter || entry.param || entry.name || entry.jsonpath;
            let value = null;

            if (entry.coordinates && Array.isArray(entry.coordinates) && entry.coordinates.length > 0) {
              const c = entry.coordinates[0];
              if (c.dates && Array.isArray(c.dates) && c.dates.length > 0) {
                const last = c.dates[c.dates.length - 1];
                if (last && typeof last === 'object' && ('value' in last)) value = last.value;
                else if (c.values && c.values.length > 0) value = c.values[c.values.length - 1];
              }
            }

            if (value == null && entry.dates && entry.values && Array.isArray(entry.values) && entry.values.length > 0) {
              value = entry.values[entry.values.length - 1];
            }

            if (value == null && entry.dates && Array.isArray(entry.dates) && entry.dates.length > 0) {
              const last = entry.dates[entry.dates.length - 1];
              if (last && typeof last === 'object' && ('value' in last)) value = last.value;
            }

            if (value == null) {
              if (entry.value != null) value = entry.value;
              else if (entry.values && entry.values.length > 0) value = entry.values[entry.values.length - 1];
            }

            if (key) windDataMap[key] = value;
          }
        } else {
          for (const p of windParams) {
            try {
              const parsed = Meteomatics.parseParameterTimeseries(windJson, p);
              if (parsed && Array.isArray(parsed.series) && parsed.series.length > 0) {
                windDataMap[p] = parsed.series[parsed.series.length - 1].value;
              } else if (parsed && parsed.raw) {
                const raw = parsed.raw;
                let v = null;
                if (raw.value != null) v = raw.value;
                else if (raw.values && raw.values.length > 0) v = raw.values[raw.values.length - 1];
                windDataMap[p] = v;
              }
            } catch (pe) {
              windDataMap[p] = null;
            }
          }
        }

        setWindData(windDataMap);
      } catch (werr) {
        console.warn('Wind fetch failed', werr);
        setRawWarnings({ error: String(werr) });
        setWindData(windDataMap);
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRaw = () => {
    console.debug('toggle raw warnings, previous:', showRaw);
    setShowRaw(v => {
      const next = !v;
      console.debug('showRaw now', next);
      return next;
    });
  };

  const handleRefresh = () => {
    console.debug('refresh clicked, lat/lon:', lat, lon);
    fetchHumidity((lat != null && lon != null) ? { lat, lon } : { lat: 52.520551, lon: 13.461804 });
  };

  // Auto-fetch when position changes
  useEffect(() => {
    if (lat != null && lon != null) {
      fetchHumidity({ lat, lon });
    }
  }, [lat, lon]);

  const displayHumidity = () => {
    if (loading) return 'Loading...';
    if (error) return `Error: ${error}`;
    if (humidity == null) return 'No data';
    return `${Math.round(humidity)} %`;
  };

  const displayTime = () => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div style={{ padding: 12, border: '1px solid #ddd', margin: 8, borderRadius: 6, background: '#fff' }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Humidity (2m)</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 28, fontWeight: '700' }}>{displayHumidity()}</div>
        <div style={{ color: '#666' }}>{timestamp ? `as of ${displayTime()}` : '—'}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => fetchHumidity((lat != null && lon != null) ? { lat, lon } : { lat: 52.520551, lon: 13.461804 })} disabled={loading}>
          {loading ? 'Fetching…' : 'Refresh'}
        </button>
      </div>
      {/* Wind panel */}
      <div style={{ marginTop: 12 }}>
        <h5 style={{ margin: '8px 0' }}>Wind</h5>
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={handleToggleRaw} style={{ fontSize: 12 }}>
            {showRaw ? 'Hide raw response' : 'Show raw response'}
          </button>
          <button onClick={handleRefresh} style={{ fontSize: 12 }} disabled={loading}>
            Refresh
          </button>
          <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>{loading ? 'Loading...' : (rawWarnings ? 'Raw available' : 'No raw')}</span>
        </div>

        {!windData && <div style={{ color: '#666' }}>No wind data</div>}
        {windData && (
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column', flexWrap: 'wrap' }}>
            {(() => {
              const labelMap = {
                [Meteomatics.windSpeed('10m','ms')]: 'Wind speed (10m) [m/s]',
                [Meteomatics.windDirection('10m')]: 'Wind direction (10m) [deg]',
                [Meteomatics.windGusts('10m','3h','ms')]: 'Wind gusts (10m, 3h) [m/s]'
              };

              return Object.entries(windData).map(([key, value]) => {
                const label = labelMap[key] || key.replace(/[:_]/g, ' ');
                const display = value == null ? '—' : String(value);
                return (
                  <div key={key} style={{ padding: 6, borderRadius: 4, background: '#fafafa', minWidth: 220 }}>
                    <span style={{ fontWeight: 600 }}>{label}:</span>
                    <span style={{ marginLeft: 8 }}>{display}</span>
                  </div>
                );
              });
            })()}
          </div>
        )}
        {lastRequest && (
          <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
            Last request: <code style={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastRequest.url}</code>
            <div style={{ fontSize: 11, color: '#999' }}>{lastRequest.time}{lastRequest.error ? ` — error: ${lastRequest.error}` : ''}</div>
          </div>
        )}
        {showRaw && rawWarnings && (
          <pre style={{ marginTop: 8, maxHeight: 240, overflow: 'auto', background: '#111', color: '#dcdcdc', padding: 8, borderRadius: 6 }}>{JSON.stringify(rawWarnings, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
