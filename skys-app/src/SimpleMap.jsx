import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SimpleMap.css';
import AirQualityMarker from './components/AirQualityMarker';
import NewsSection from './components/NewsSection';
import Prediction from './components/Prediction';
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

  const [isShowMore, setIsShowMore] = useState(false);

    const collapseClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsShowMore(!isShowMore);
    };

  useEffect(() => {
    console.log('isShowMore changed to:', isShowMore);
  }, [isShowMore]);

  useEffect(() => {

    if (position && typeof props.onPositionChange === 'function') {
      try { props.onPositionChange({ position, label: undefined }); } catch (e) { /* ignore */ }
    }

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
    // notify parent components about the position change (optional prop)
    if (typeof props.onPositionChange === 'function') {
      props.onPositionChange({ position: coordinates, label });
    }
  };

  const handleMapClick = (latlng) => {
    const { lat, lng } = latlng;
    setPosition([lat, lng]);
    fetchAirQualityForLocation(lat, lng);
    if (typeof props.onPositionChange === 'function') {
      props.onPositionChange({ position: [lat, lng], label: undefined });
    }
  };

  useEffect(() => {
    if (!position) return;
    if (!props.onPositionChange || typeof props.onPositionChange !== 'function') return;
    if (airQualityData && airQualityData.length > 0) {
      const city = airQualityData[0]?.city;
      if (city) {
        try { props.onPositionChange({ position, label: city }); } catch (e) { /* ignore */ }
      }
    }
  }, [airQualityData]);

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

        <div className="map-overlays">
          {/* Air Quality Markers */}
        {airQualityData.length > 0 && airQualityData.map((aqData, index) => (
          <AirQualityMarker
            key={`${aqData.location}-${index}`}
            data={{...aqData, coordinates: {latitude: position[0], longitude: position[1]}}}
          />
        ))}
        </div>

        {/* AQI Box - Top Left - Outside map-overlays so button works */}
        {(airQualityLoading || airQualityData.length > 0) && (
          <div style={{position: 'absolute', top: '10px', left: '10px', zIndex: 1000}}>
            {airQualityLoading ? (
              <div className="aqi-compact-card loading">
                <div className="aqi-loading-spinner"></div>
                <p style={{ color: 'white', margin: 0, fontSize: '13px' }}>Loading...</p>
              </div>
            ) : airQualityData.length > 0 && getAirQualitySummary(airQualityData).status !== 'No Data' ? (
              <div className="aqi-compact-card" onClick={(e) => e.stopPropagation()}>
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
                <button
                  type="button"
                  className="show-more-info"
                  onMouseDown={collapseClick}
                  style={{position: 'relative', zIndex: 9999}}
                >
                  {isShowMore ? '\u21D1 Collapse' : '\u21D3 More Info'}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Meteomatics demo panel (humidity + wind) - Below AQI box */}
        {isShowMore && position && (
          <div style={{position: 'absolute', top: '90px', left: '10px', zIndex: 1000}}>
            <MeteomaticsDemo lat={position[0]} lon={position[1]} />
          </div>
        )}
        
        </div>
          
        {/* News Section Overlay - Below AQI box */}
        <NewsSection />
      </MapContainer>
      {/* Prediction panel below the map */}
      <div className="map-bottom-overlay">
        <Prediction location={{ position, label: airQualityData[0]?.city || undefined }} />
      </div>
    </div>
  );
});

export default SimpleMap;
