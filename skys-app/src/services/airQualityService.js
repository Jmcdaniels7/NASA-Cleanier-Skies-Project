// Air Quality Service using AQI CN API (free, no CORS issues)

const AQI_API_BASE_URL = 'https://api.waqi.info/feed';
const WAQI_TOKEN = process.env.REACT_APP_WAQI_API_KEY;

// AQI color coding based on PM2.5 levels
export const AQI_COLORS = {
  good: '#00E400',      // 0-50 μg/m³
  moderate: '#FFFF00',  // 51-100 μg/m³
  unhealthy: '#FF7E00', // 101-150 μg/m³
  veryUnhealthy: '#FF0000', // 151-200 μg/m³
  hazardous: '#8F3F97', // 201+ μg/m³
  noData: '#CCCCCC'     // No data available
};

// Get AQI color based on PM2.5 value
export const getAQIColor = (pm25) => {
  if (!pm25 || pm25 === null) return AQI_COLORS.noData;
  
  if (pm25 <= 50) return AQI_COLORS.good;
  if (pm25 <= 100) return AQI_COLORS.moderate;
  if (pm25 <= 150) return AQI_COLORS.unhealthy;
  if (pm25 <= 200) return AQI_COLORS.veryUnhealthy;
  return AQI_COLORS.hazardous;
};

// Get AQI category name
export const getAQICategory = (pm25) => {
  if (!pm25 || pm25 === null) return 'No Data';
  
  if (pm25 <= 50) return 'Good';
  if (pm25 <= 100) return 'Moderate';
  if (pm25 <= 150) return 'Unhealthy for Sensitive Groups';
  if (pm25 <= 200) return 'Unhealthy';
  return 'Hazardous';
};

// Get health recommendation
export const getHealthRecommendation = (pm25) => {
  if (!pm25 || pm25 === null) return 'No air quality data available';
  
  if (pm25 <= 50) return 'Air quality is satisfactory. Enjoy outdoor activities!';
  if (pm25 <= 100) return 'Air quality is acceptable. Sensitive individuals may experience minor breathing discomfort.';
  if (pm25 <= 150) return 'Sensitive groups should reduce prolonged outdoor exertion.';
  if (pm25 <= 200) return 'Everyone should avoid prolonged outdoor exertion.';
  return 'Everyone should avoid all outdoor activities. Stay indoors if possible.';
};

// Fetch air quality data for a specific location
export const fetchAirQualityData = async (latitude, longitude, radius = 10000) => {
  try {
    // WAQI API uses geo coordinates directly
    const url = `${AQI_API_BASE_URL}/geo:${latitude};${longitude}/?token=${WAQI_TOKEN}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'ok' || !data.data) {
      console.error('Invalid API response:', data);
      return [];
    }

    const station = data.data;
    const iaqi = station.iaqi || {};

    // WAQI returns AQI values directly (0-500 scale)
    // The main AQI is already calculated, use it directly
    const mainAQI = station.aqi || 0;

    // For display purposes, treat AQI values as PM2.5 equivalent
    // AQI scale matches our color coding: 0-50 Good, 51-100 Moderate, etc.
    const pm25Value = mainAQI;

    return [{
      location: station.city?.name || 'Unknown Station',
      coordinates: {
        latitude: station.city?.geo?.[0] || latitude,
        longitude: station.city?.geo?.[1] || longitude
      },
      city: station.city?.name || 'Unknown',
      country: station.city?.country || 'Unknown',
      lastUpdated: station.time?.iso || new Date().toISOString(),
      pm25: pm25Value,
      pm10: iaqi.pm10?.v || null,
      no2: iaqi.no2?.v || null,
      o3: iaqi.o3?.v || null,
      co: iaqi.co?.v || null,
      aqi: mainAQI,
      aqiColor: getAQIColor(pm25Value),
      aqiCategory: getAQICategory(pm25Value),
      healthRecommendation: getHealthRecommendation(pm25Value)
    }];
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    return [];
  }
};

// Fetch air quality data for multiple locations (for search results)
export const fetchAirQualityForSearch = async (searchResults) => {
  const airQualityPromises = searchResults.map(async (result) => {
    try {
      const [lat, lng] = result.coordinates;
      const aqData = await fetchAirQualityData(lat, lng, 5000); // Smaller radius for search
      
      // Get the closest/best reading
      const bestReading = aqData.length > 0 ? aqData[0] : null;
      
      return {
        ...result,
        airQuality: bestReading ? {
          pm25: bestReading.pm25,
          aqiColor: bestReading.aqiColor,
          aqiCategory: bestReading.aqiCategory,
          lastUpdated: bestReading.lastUpdated
        } : null
      };
    } catch (error) {
      console.error(`Error fetching air quality for ${result.label}:`, error);
      return result;
    }
  });
  
  return Promise.all(airQualityPromises);
};

// Check if air quality is dangerous for alerts
export const isDangerousAirQuality = (pm25) => {
  return pm25 && pm25 > 100; // Alert if PM2.5 > 100 (moderate or worse)
};

// Get air quality summary for a location
export const getAirQualitySummary = (airQualityData) => {
  if (!airQualityData || airQualityData.length === 0) {
    return {
      status: 'No Data',
      color: AQI_COLORS.noData,
      message: 'No air quality data available for this area'
    };
  }
  
  // Get the most recent reading
  const latestReading = airQualityData[0];
  const pm25 = latestReading.pm25;
  
  return {
    status: getAQICategory(pm25),
    color: getAQIColor(pm25),
    message: getHealthRecommendation(pm25),
    pm25: pm25,
    lastUpdated: latestReading.lastUpdated
  };
};
