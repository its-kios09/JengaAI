import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

type LineChartDataPoint = Record<string, string | number>;

type LineConfig = {
  key: string;
  color: string;
  label: string;
};

type LineChartWidgetProps = {
  data: LineChartDataPoint[];
  lines: LineConfig[];
  xKey: string;
  height?: number;
};

export function LineChartWidget({ data, lines, xKey, height = 300 }: LineChartWidgetProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
        <XAxis dataKey={xKey} stroke="#737373" fontSize={12} />
        <YAxis stroke="#737373" fontSize={12} />
        <Tooltip
          contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', color: '#f5f5f5' }}
        />
        <Legend />
        {lines.map((line) => (
          <Line key={line.key} type="monotone" dataKey={line.key} name={line.label} stroke={line.color} strokeWidth={2} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
