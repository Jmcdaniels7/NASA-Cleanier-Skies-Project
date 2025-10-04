import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';

const ReusableLineChart = ({ data, dataKey = 'uv', lineName = 'Data', width = 600, height = 300, xKey = 'name', yLabel = 'UV' }) => {
  return (
    <LineChart
      width={width}
      height={height}
      data={data}
      margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
    >
      <CartesianGrid stroke="#aaa" strokeDasharray="5 5" />
      <Line type="monotone" dataKey={dataKey} stroke="purple" strokeWidth={2} name={lineName} />
      <XAxis dataKey={xKey} />
      <YAxis width="auto" label={{ value: yLabel, position: 'insideLeft', angle: -90 }} />
      <Legend align="right" />
    </LineChart>
  );
};

export default ReusableLineChart;
