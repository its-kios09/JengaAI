import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

type PieChartDataPoint = {
  name: string;
  value: number;
};

type PieChartWidgetProps = {
  data: PieChartDataPoint[];
  height?: number;
  colors?: string[];
};

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function PieChartWidget({ data, height = 300, colors = DEFAULT_COLORS }: PieChartWidgetProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={{ stroke: '#737373' }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', color: '#f5f5f5' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
