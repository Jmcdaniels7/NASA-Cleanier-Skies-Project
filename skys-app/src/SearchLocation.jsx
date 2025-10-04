import React, { useState, useRef, useEffect } from 'react';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import './SearchLocation.css';

const SearchLocation = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const provider = useRef(new OpenStreetMapProvider());

  // Handle search with debouncing
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await provider.current.search({ query });
        setResults(searchResults.slice(0, 5)); // Limit to 5 results
        setShowResults(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleLocationSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleLocationSelect = (location) => {
    const coordinates = [location.y, location.x]; // [lat, lng]
    onLocationSelect(coordinates, location.label);
    setQuery(location.label);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for click events
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="search-location-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <div className="search-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Search for any location..."
          className="search-input"
        />
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((result, index) => (
            <div
              key={`${result.y}-${result.x}`}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleLocationSelect(result)}
            >
              <div className="result-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="result-content">
                <div className="result-label">{result.label}</div>
                <div className="result-type">{result.raw?.type || 'Location'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchLocation;
