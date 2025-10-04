import React, { useState, useEffect } from 'react';
import Meteomatics from '../services/meteomaticsService';

export default function MeteomaticsDemo({ lat, lon }) {
  const [loading, setLoading] = useState(false);
  const [humidity, setHumidity] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
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
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
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
    </div>
  );
}
