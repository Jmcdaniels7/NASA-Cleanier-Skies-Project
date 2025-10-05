import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';

// Responsive reusable line chart. Use a parent container with desired width and height
// Example: <div style={{ width: '100%', height: 160 }}><ReusableLineChart ... /></div>
const ReusableLineChart = ({ data, dataKey = 'uv', lineName = 'Data', height = 200, xKey = 'name', yLabel = '' }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 20, bottom: 6, left: 0 }}>
        <CartesianGrid stroke="#e6e6e6" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#6a1b9a"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          name={lineName}
        />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} label={yLabel ? { value: yLabel, position: 'insideLeft', angle: -90, offset: 8 } : null} />
        <Legend verticalAlign="top" align="right" height={24} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ReusableLineChart;
