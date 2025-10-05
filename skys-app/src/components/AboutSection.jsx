import React, { useState, useEffect, useRef } from 'react';
import './AboutSection.css';

function AboutSection() {
    return (
        <div className="about-section">
        <div className="news-header">
            <h1>Clear Skies Indy</h1>
            </div>
        <div className="about-content">
            <p>Clear Skies Indy is a project that grabs realtime Air Quality Index data of any given location.
                This was created for NASA's 2025 Space Apps Challenge to display AQI data from the World Air Quality Index (WAQI) API for anyone to read.
            </p>
            <p>Clicking around on the map below displays the current AQI for a selected location.
                Humidity and Wind data are also made available by the Meteomatics API. Relevant world news articles about air quality are also displayed within the map view.
                AQI forecast data is also displayed in a graph below the map.
            </p>
            <p>
                The map display is powered by Leaflet.JS, and implements OpenStreetMap to display detailed map imagery.
            </p>
            </div>
        </div>
    );
}
    
export default AboutSection;
