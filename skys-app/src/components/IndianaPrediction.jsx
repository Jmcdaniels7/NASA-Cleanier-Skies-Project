// MyAirQualityChart.jsx
import React, { useEffect, useState } from 'react';
import ReusableLineChart from './ReusableLineChart';

const MyAirQualityChart = () => {
  const [data, setData] = useState([]);

  const url = 'https://api.meteomatics.com/2025-10-04T13:35:00.000-04:00--2025-10-05T13:35:00.000-04:00:PT5M/air_quality:idx/40.3270127,-86.1746933/json?model=mix';

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (!json.data || !json.data.length) return;

        const dates = json.data[0].coordinates[0].dates;
        const chartData = dates.map(d => ({
          name: new Date(d.date).toLocaleTimeString(), // x-axis
          uv: d.value, // y-axis
        }));

        setData(chartData);
      })
      .catch(err => console.error('Error fetching chart data:', err));
  }, []);

  return (
    <div>
      <h2>Air Quality Index Over Time</h2>
      <ReusableLineChart data={data} dataKey="uv" lineName="Air Quality" yLabel="AQI" />
    </div>
  );
};

export default MyAirQualityChart;
