import React, { useRef, useState } from 'react';
import './App.css';
import SimpleMap from './SimpleMap';
import SearchLocation from './SearchLocation';
import OptinAlert from './components/alert';
import Prediction from './components/Prediction';
import AboutSection from './components/AboutSection'; 


function App() {
  const mapRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (coordinates, label) => {
    // Pass the location to the map component
    if (mapRef.current) {
      mapRef.current.handleLocationSelect(coordinates, label);
    }
    setSelectedLocation({ position: coordinates, label });
  };

  return (
    <>
    <div className="App">
      <div className="optin-alert">
        <OptinAlert apiUrl={process.env.REACT_APP_API_URL} />
      </div>
      <main className="App-main">
        <AboutSection />
  <div className="searchable-map-container">
  <SearchLocation onLocationSelect={handleLocationSelect} />
  <SimpleMap ref={mapRef} onPositionChange={setSelectedLocation} />
    {/* Prediction panel placed under the map and spanning the map width */}
    <div className="map-bottom-overlay">
      <Prediction location={selectedLocation} />
    </div>
  </div>
      </main>
    </div>
  </>
    
  );
}

export default App;
