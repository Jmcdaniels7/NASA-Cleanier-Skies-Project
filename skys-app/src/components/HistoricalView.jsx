
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer} from 'recharts';

function HistoricalView() {
      const data = [{name: 'Location Name', uv: 400, pv: 2400, amt: 2400},];

return (
    <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid stroke="#aaa" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="uv" stroke="purple" strokeWidth={2} name="Air Quality" />
              <XAxis dataKey="name" />
              <YAxis width="auto" label={{ value: 'Air Quality', position: 'outsideLeft', angle: -90 }} />
              <Legend align="right" />
              <Tooltip />
              </LineChart>
    </ResponsiveContainer>
);
}

export default HistoricalView;

