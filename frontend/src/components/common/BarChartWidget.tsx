import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

type BarChartDataPoint = Record<string, string | number>;

type BarChartWidgetProps = {
  data: BarChartDataPoint[];
  dataKey: string;
  nameKey: string;
  color?: string;
  height?: number;
  layout?: 'horizontal' | 'vertical';
};

export function BarChartWidget({ data, dataKey, nameKey, color = '#3b82f6', height = 300, layout = 'horizontal' }: BarChartWidgetProps) {
  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis type="number" stroke="#737373" fontSize={12} />
          <YAxis dataKey={nameKey} type="category" stroke="#737373" fontSize={12} width={100} />
          <Tooltip contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', color: '#f5f5f5' }} />
          <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
        <XAxis dataKey={nameKey} stroke="#737373" fontSize={12} />
        <YAxis stroke="#737373" fontSize={12} />
        <Tooltip contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', color: '#f5f5f5' }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
