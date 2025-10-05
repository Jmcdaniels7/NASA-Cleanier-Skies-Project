import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SimpleMap.css';
import AirQualityMarker from './components/AirQualityMarker';
import NewsSection from './components/NewsSection';
import { fetchAirQualityData, getAirQualitySummary, isDangerousAirQuality } from './services/airQualityService';
import MeteomaticsDemo from './components/MeteomaticsDemo';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

const SimpleMap = forwardRef((props, ref) => {
  const [position, setPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [airQualityData, setAirQualityData] = useState([]);
  const [airQualityLoading, setAirQualityLoading] = useState(false);
  const [airQualityError, setAirQualityError] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Default coordinates for New York City
    const defaultPosition = [40.7128, -74.0060];

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setPosition(defaultPosition);
      setIsLoading(false);
      return;
    }

    // Get user's current position
    navigator.geolocation.getCurrentPosition(
      (success) => {
        const { latitude, longitude } = success.coords;
        setPosition([latitude, longitude]);
        setIsLoading(false);
      },
      (error) => {
        console.warn('Error getting location:', error.message);
        setError('Unable to detect location');
        setPosition(defaultPosition);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Fetch air quality data for current location
  const fetchAirQualityForLocation = useCallback(async (lat, lng) => {
    setAirQualityLoading(true);
    setAirQualityError(null);

    try {
      const data = await fetchAirQualityData(lat, lng);
      setAirQualityData(data);

      // Check for dangerous air quality and show alert
      const summary = getAirQualitySummary(data);
      if (isDangerousAirQuality(summary.pm25)) {
        showAirQualityAlert(summary);
      }
    } catch (error) {
      console.error('Error fetching air quality data:', error);
      setAirQualityError('Unable to load air quality data');
    } finally {
      setAirQualityLoading(false);
    }
  }, []);

  // Debounced air quality fetch to prevent vibration
  const debouncedFetchAirQuality = useCallback(() => {
    const timeoutId = setTimeout(() => {
      if (position) {
        fetchAirQualityForLocation(position[0], position[1]);
        requestNotificationPermission();
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timeoutId);
  }, [position, fetchAirQualityForLocation]);

  // Fetch air quality data when position changes
  useEffect(() => {
    const cleanup = debouncedFetchAirQuality();
    return cleanup;
  }, [debouncedFetchAirQuality]);

  // Show air quality alert
  const showAirQualityAlert = (summary) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Air Quality Alert', {
        body: `${summary.status}: ${summary.message}`,
        icon: '/favicon.ico'
      });
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    // Temporarily disabled to prevent layout issues
    // if ('Notification' in window && Notification.permission === 'default') {
    //   await Notification.requestPermission();
    // }
  };

  // Handle location search
  const handleLocationSelect = (coordinates, label) => {
    setPosition(coordinates);
    if (mapRef.current) {
      mapRef.current.setView(coordinates, 13);
    }
    // Fetch air quality data for the new location
    fetchAirQualityForLocation(coordinates[0], coordinates[1]);
  };

  // Handle map click to fetch AQI at clicked location
  const handleMapClick = (latlng) => {
    const { lat, lng } = latlng;
    setPosition([lat, lng]);
    fetchAirQualityForLocation(lat, lng);
  };

  // Expose the handleLocationSelect method to parent components
  useImperativeHandle(ref, () => ({
    handleLocationSelect
  }));

  if (isLoading) {
    return (
      <div className="map-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Detecting your location...</p>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="map-error">
        <p>Unable to load map</p>
      </div>
    );
  }

  return (
    <div className="simple-map-container">
      <MapContainer
        ref={mapRef}
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        className="simple-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map click handler */}
        <MapClickHandler onMapClick={handleMapClick} />

        <Marker position={position}>
          <Popup>
            You are here 📍
          </Popup>
        </Marker>

        {/* Air Quality Markers */}
        {airQualityData.length > 0 && airQualityData.map((aqData, index) => (
          <AirQualityMarker key={`${aqData.location}-${index}`} data={aqData} />
        ))}

        {/* AQI Box Inside Map - Top Left - Only when data exists */}
        {(airQualityLoading || airQualityData.length > 0) && (
          <div className="aqi-box-overlay">
            {airQualityLoading ? (
              <div className="aqi-compact-card loading">
                <div className="aqi-loading-spinner"></div>
                <p style={{ color: 'white', margin: 0, fontSize: '13px' }}>Loading...</p>
              </div>
            ) : airQualityData.length > 0 && getAirQualitySummary(airQualityData).status !== 'No Data' ? (
              <div className="aqi-compact-card">
                <div className="aqi-compact-indicator" style={{ backgroundColor: getAirQualitySummary(airQualityData).color }}>
                  <span className="aqi-compact-value">
                    {getAirQualitySummary(airQualityData).pm25 ? Math.round(getAirQualitySummary(airQualityData).pm25) : '?'}
                  </span>
                  <span className="aqi-compact-label">AQI</span>
                </div>
                <div className="aqi-compact-info">
                  <div className="aqi-compact-status">{getAirQualitySummary(airQualityData).status}</div>
                  <div className="aqi-compact-location">{airQualityData[0]?.city || 'Unknown'}</div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* News Section Overlay - Below AQI box */}
        <NewsSection />
      </MapContainer>
      {error && (
        <div className="map-warning">
          <p>{error}. Using default location (New York City).</p>
        </div>
      )}
      {/* Meteomatics demo panel (humidity + wind) */}
      {position && (
        <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 4000 }}>
          <MeteomaticsDemo lat={position[0]} lon={position[1]} />
        </div>
      )}
      
      {/* Air Quality Status */}
      {airQualityLoading && (
        <div className="air-quality-status loading">
          <div className="status-spinner"></div>
          <p>Loading air quality data...</p>
        </div>
      )}
      
      {airQualityError && (
        <div className="air-quality-status error">
          <p>{airQualityError}</p>
        </div>
      )}
      
      {!airQualityLoading && !airQualityError && airQualityData.length > 0 && (
        <div className="air-quality-status">
          <div className="status-header">
            <h4>🌫️ Air Quality Status</h4>
            <span className="sensor-count">{airQualityData.length} sensor{airQualityData.length !== 1 ? 's' : ''} nearby</span>
          </div>
          <div className="status-summary">
            {getAirQualitySummary(airQualityData).status !== 'No Data' ? (
              <div className="summary-card">
                <div className="summary-indicator" style={{ backgroundColor: getAirQualitySummary(airQualityData).color }}>
                  <span className="summary-value">
                    {getAirQualitySummary(airQualityData).pm25 ? Math.round(getAirQualitySummary(airQualityData).pm25) : '?'} μg/m³
                  </span>
                  <span className="summary-category">{getAirQualitySummary(airQualityData).status}</span>
                </div>
                <p className="summary-message">{getAirQualitySummary(airQualityData).message}</p>
              </div>
            ) : (
              <div className="no-data">
                <p>No air quality data available for this area</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default SimpleMap;
