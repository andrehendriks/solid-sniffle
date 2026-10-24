import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import type { BenchmarkTrend } from "../types";

interface Props {
  data: BenchmarkTrend[];
  metricKey?: string;
  label?: string;
  color?: string;
}

export default function TrendChart({
  data,
  metricKey = "score",
  label = "Score",
  color = "#3b82f6",
}: Props) {
  const chartData = data.map((d) => ({
    time: format(new Date(d.timestamp), "MM/dd HH:mm"),
    value:
      metricKey === "score"
        ? d.score
        : typeof d.metrics[metricKey] === "number"
        ? (d.metrics[metricKey] as number)
        : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={{ stroke: "#374151" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={{ stroke: "#374151" }}
          width={45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#9ca3af" }}
          itemStyle={{ color: "#e5e7eb" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          name={label}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
