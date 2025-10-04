import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SimpleMap.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SimpleMap = forwardRef((props, ref) => {
  const [position, setPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Default coordinates for New York City
  const defaultPosition = [40.7128, -74.0060];

  useEffect(() => {
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
  }, [defaultPosition]);

  // Handle location search
  const handleLocationSelect = (coordinates, label) => {
    setPosition(coordinates);
    if (mapRef.current) {
      mapRef.current.setView(coordinates, 13);
    }
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
        <Marker position={position}>
          <Popup>
            You are here 📍
          </Popup>
        </Marker>
      </MapContainer>
      {error && (
        <div className="map-warning">
          <p>{error}. Using default location (New York City).</p>
        </div>
      )}
    </div>
  );
});

export default SimpleMap;
