import React, { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getAQIColor, getAQICategory } from '../services/airQualityService';
import './AirQualityMarker.css';

// Create custom icon for air quality markers
const createAirQualityIcon = (pm25, aqiColor) => {
  const iconSize = 25;
  const iconHtml = `
    <div style="
      width: ${iconSize}px;
      height: ${iconSize}px;
      background: ${aqiColor};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
    ">
      ${pm25 ? Math.round(pm25) : '?'}
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'air-quality-marker',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2]
  });
};

const AirQualityMarker = memo(({ data }) => {
  const { coordinates, pm25, pm10, no2, o3, co, aqiColor, aqiCategory, healthRecommendation, location, city, country, lastUpdated } = data;
  
  const customIcon = createAirQualityIcon(pm25, aqiColor);
  
  const formatValue = (value, unit = 'μg/m³') => {
    if (value === null || value === undefined) return 'No data';
    return `${Math.round(value)} ${unit}`;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Marker position={[coordinates.latitude, coordinates.longitude]} icon={customIcon}>
      <Popup className="air-quality-popup">
        <div className="air-quality-popup-content">
          <div className="popup-header">
            <h3>{location}</h3>
            <p className="location-details">{city}, {country}</p>
          </div>
          
          <div className="aqi-status">
            <div className="aqi-indicator" style={{ backgroundColor: aqiColor }}>
              <span className="aqi-value">{formatValue(pm25)}</span>
              <span className="aqi-category">{aqiCategory}</span>
            </div>
          </div>
          
          <div className="pollutants-grid">
            <div className="pollutant">
              <span className="pollutant-name">PM2.5</span>
              <span className="pollutant-value">{formatValue(pm25)}</span>
            </div>
            <div className="pollutant">
              <span className="pollutant-name">PM10</span>
              <span className="pollutant-value">{formatValue(pm10)}</span>
            </div>
            <div className="pollutant">
              <span className="pollutant-name">NO₂</span>
              <span className="pollutant-value">{formatValue(no2)}</span>
            </div>
            <div className="pollutant">
              <span className="pollutant-name">O₃</span>
              <span className="pollutant-value">{formatValue(o3)}</span>
            </div>
            <div className="pollutant">
              <span className="pollutant-name">CO</span>
              <span className="pollutant-value">{formatValue(co, 'ppm')}</span>
            </div>
          </div>
          
          <div className="health-recommendation">
            <h4>Health Recommendation:</h4>
            <p>{healthRecommendation}</p>
          </div>
          
          <div className="last-updated">
            <small>Last updated: {formatDate(lastUpdated)}</small>
          </div>
          
          <div className="data-source">
            <small>Data source: OpenAQ</small>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

AirQualityMarker.displayName = 'AirQualityMarker';

export default AirQualityMarker;
