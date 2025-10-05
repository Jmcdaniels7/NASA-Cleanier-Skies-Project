import React, { useRef } from 'react';
import './App.css';
import SimpleMap from './SimpleMap';
import SearchLocation from './SearchLocation';
import OptinAlert from './components/alert';

function App() {
  const mapRef = useRef(null);

  const handleLocationSelect = (coordinates, label) => {
    // Pass the location to the map component
    if (mapRef.current) {
      mapRef.current.handleLocationSelect(coordinates, label);
    }
  };

  return (
    <>
    <div className="App">
      <div className="optin-alert">
        <OptinAlert apiUrl={process.env.REACT_APP_API_URL} />
      </div>
      <main className="App-main">
        <SearchLocation onLocationSelect={handleLocationSelect} />
  <SimpleMap ref={mapRef} />
      </main>
    </div>
  </>
    
  );
}

export default App;
