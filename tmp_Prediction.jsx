import React, { useEffect, useState } from 'react';
import { getPrediction, pm25ToAQI, aqiCategory } from '../services/predictionService';
import ReusableLineChart from './ReuseableLineChart';

// Prediction component now receives `position` prop = [lat, lon]
// It auto-fetches predictions for the selected location and shows a compact status card.
export default function Prediction({ location }) {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const pos = location?.position;
      if (!pos || pos.length < 2) return;
      setLoading(true);
      try {
  const [lat, lon] = pos;
  const res = await getPrediction({ lat: Number(lat), lon: Number(lon), hours: 24 });
        if (mounted) setPredictions(res.predictions || []);
      } catch (err) {
        console.error('Prediction error', err);
        if (mounted) setPredictions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [location?.position]);

  // Determine AQI from predictions (convert PM2.5 to AQI)
  const statusInfo = (() => {
    if (loading) return { label: 'Loading...', color: 'gray', numeric: '?' };
    if (!predictions || predictions.length === 0) return { label: 'No Data', color: 'rgba(255,255,255,0.6)', numeric: '?' };
    const sample = predictions.slice(0, 12);
    const avgPm = sample.reduce((s, p) => s + (p.value || 0), 0) / sample.length;
    const aqi = pm25ToAQI(avgPm);
    const cat = aqiCategory(aqi);
    return { label: cat.label, color: cat.color, numeric: aqi };
  })();

  return (
  <div className="air-quality-status" style={{ width: 'min(960px, 94%)', margin: '0 auto', padding: '12px 16px' }}>
      <div className={`status-header ${loading ? 'loading' : ''}`}>
        <h4 style={{ color: 'white', margin: 0 }}>Predicted air quality</h4>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
        <div className="summary-indicator" style={{ background: 'transparent' }}>
          <div className="summary-value" style={{ color: statusInfo.color, fontSize: 22 }}>{statusInfo.numeric}</div>
          <div className="summary-category" style={{ color: 'white' }}>{statusInfo.label}</div>
        </div>
        <div style={{ flex: 1 }}>
          <p className="summary-message" style={{ margin: 0 }}>
            {location && location.position && location.position.length === 2
              ? (location.label || `Predictions for (${Number(location.position[0]).toFixed(3)}, ${Number(location.position[1]).toFixed(3)})`)
              : 'Select a location on the map.'}
          </p>
        </div>
      </div>
      {/* Line chart showing predicted AQI over time */}
      {predictions && predictions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {/* Build chart data: convert each predicted pm2.5 -> AQI */}
          {(() => {
            const chartData = predictions.map(p => ({
              name: new Date(p.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              aqi: pm25ToAQI(p.value),
              pm25: p.value
            }));
            return (
              <ReusableLineChart
                data={chartData}
                dataKey="aqi"
                xKey="name"
                lineName="AQI"
                yLabel="AQI"
                width={Math.min(880, Math.max(320, Math.floor((window.innerWidth || 800) * 0.75)))}
                height={140}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}
