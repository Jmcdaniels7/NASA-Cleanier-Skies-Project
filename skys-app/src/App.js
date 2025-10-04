import React, { useRef } from 'react';
import './App.css';
import SimpleMap from './SimpleMap';
import SearchLocation from './SearchLocation';
import NewsSection from './components/NewsSection';

function App() {
  const mapRef = useRef(null);

  const handleLocationSelect = (coordinates, label) => {
    // Pass the location to the map component
    if (mapRef.current) {
      mapRef.current.handleLocationSelect(coordinates, label);
    }
  };

  return (
    <div className="App">
      <main className="App-main">
        <SearchLocation onLocationSelect={handleLocationSelect} />
        <SimpleMap ref={mapRef} />
      </main>
    </div>
  );
}

export default App;
