import React, { useState, useEffect } from 'react';
import Meteomatics from '../services/meteomaticsService';
import './MeteomaticsDemo.css';

export default function MeteomaticsDemo({ lat, lon }) {
  const [loading, setLoading] = useState(false);
  const [humidity, setHumidity] = useState(null);
  const [windData, setWindData] = useState(null);
  const [error, setError] = useState(null);

  const fetchHumidity = async (location) => {
  setLoading(true);
  setError(null);
  setHumidity(null);

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
      } else if (parsed && parsed.raw) {
        setError('No timeseries data returned');
      } else {
        setError('No data');
      }
      // fetch only the three parameters: speed, direction, gusts
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

        const windJson = await Meteomatics.fetchMeteomaticsJson(windOptions);
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
        setWindData(windDataMap);
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
    return `${Math.round(humidity)}%`;
  };

  return (
    <div className="more-details-container">
      <div className="humidity-display">
        <h4>Humidity</h4>
        <div>
          <p className="humidity-value">{displayHumidity()}</p>
          </div>
          </div>
      {/* Wind panel */}
      <div>
        <h4>Wind</h4>
        <div>
          <span>{loading ? 'Loading...' : ''}</span>
        </div>

        {!windData && <div>No wind data</div>}
        {windData && (
          <div>
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
                  <div className="wind-info-display" key={key}>
                    <span className="wind-info-label">{label}: </span>
                    <span className="wind-info-data">{display}</span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
