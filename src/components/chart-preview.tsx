"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartType, compactNumber } from "@/lib/chart-config";
import type { Column } from "@/lib/data";

export type ChartPoint = Record<string, string | number | null>;
type Props = {
  type: ChartType;
  data: ChartPoint[];
  series: Column[];
  colors: string[];
  showGrid: boolean;
};

export function ChartPreview({ type, data, series, colors, showGrid }: Props) {
  const tooltip = (
    <Tooltip
      contentStyle={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        background: "var(--card)",
        color: "var(--foreground)",
        fontSize: 12,
        boxShadow: "0 8px 30px #22372c12",
      }}
      cursor={{ fill: "#eaf0e94d" }}
    />
  );
  const axes = (
    <>
      {showGrid && (
        <CartesianGrid
          strokeDasharray="3 5"
          vertical={false}
          stroke="#888888"
          strokeOpacity={0.18}
        />
      )}
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        tick={{ fill: "#8b8b90", fontSize: 11 }}
        tickMargin={14}
        minTickGap={20}
      />
      <YAxis
        tickFormatter={compactNumber}
        tickLine={false}
        axisLine={false}
        tick={{ fill: "#8b8b90", fontSize: 11 }}
        width={52}
        tickMargin={12}
      />
      {tooltip}
    </>
  );
  const margin = { top: 15, right: 15, left: 0, bottom: 12 };
  let chart;
  switch (type) {
    case "bar":
      chart = (
        <BarChart data={data} margin={margin} barGap={4}>
          {axes}
          {series.map((column, i) => (
            <Bar
              key={column.id}
              dataKey={column.id}
              name={column.name}
              fill={colors[i % colors.length]}
              radius={[5, 5, 0, 0]}
              maxBarSize={36}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      );
      break;
    case "line":
      chart = (
        <LineChart data={data} margin={margin}>
          {axes}
          {series.map((column, i) => (
            <Line
              key={column.id}
              type="monotone"
              dataKey={column.id}
              name={column.name}
              stroke={colors[i % colors.length]}
              strokeWidth={3}
              dot={
                data.length <= 24
                  ? {
                      r: 3,
                      fill: colors[i % colors.length],
                      strokeWidth: 2,
                      stroke: "white",
                    }
                  : false
              }
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      );
      break;
    case "area":
      chart = (
        <AreaChart data={data} margin={margin}>
          <defs>
            {series.map((column, i) => (
              <linearGradient
                key={column.id}
                id={`fill-${column.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={colors[i % colors.length]}
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor={colors[i % colors.length]}
                  stopOpacity={0.03}
                />
              </linearGradient>
            ))}
          </defs>
          {axes}
          {series.map((column, i) => (
            <Area
              key={column.id}
              type="monotone"
              dataKey={column.id}
              name={column.name}
              stroke={colors[i % colors.length]}
              fill={`url(#fill-${column.id})`}
              strokeWidth={2.5}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      );
      break;
    case "pie":
    case "donut":
      chart = (
        <PieChart>
          {tooltip}
          <Pie
            data={data}
            dataKey={series[0]?.id ?? ""}
            nameKey="label"
            innerRadius={type === "donut" ? "52%" : 0}
            outerRadius="85%"
            paddingAngle={2}
            stroke="white"
            strokeWidth={3}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      );
      break;
    case "scatter":
      chart = (
        <ScatterChart margin={margin}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 5"
              stroke="#888888"
              strokeOpacity={0.18}
            />
          )}
          <XAxis
            dataKey="x"
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8b8b90", fontSize: 11 }}
            tickFormatter={compactNumber}
            tickMargin={14}
            domain={["auto", "auto"]}
          />
          <YAxis
            dataKey="y"
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8b8b90", fontSize: 11 }}
            tickFormatter={compactNumber}
            width={52}
            tickMargin={12}
            domain={["auto", "auto"]}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="scatter-tooltip">
                  <strong>{String(payload[0].payload.label)}</strong>
                  <span>X: {payload[0].payload.x}</span>
                  <span>Y: {payload[0].payload.y}</span>
                </div>
              ) : null
            }
          />
          {series.map((column, i) => (
            <Scatter
              key={column.id}
              name={column.name}
              data={data
                .filter(
                  (row) =>
                    typeof row.x === "number" &&
                    typeof row[column.id] === "number",
                )
                .map((row) => ({
                  x: row.x,
                  y: row[column.id],
                  label: row.label,
                }))}
              fill={colors[i % colors.length]}
              fillOpacity={0.8}
              isAnimationActive={false}
            />
          ))}
        </ScatterChart>
      );
      break;
    case "radar":
      chart = (
        <RadarChart data={data} outerRadius="78%">
          {showGrid && <PolarGrid stroke="#888888" strokeOpacity={0.25} />}
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "#8b8b90", fontSize: 11 }}
          />
          {tooltip}
          {series.map((column, i) => (
            <Radar
              key={column.id}
              name={column.name}
              dataKey={column.id}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.14}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </RadarChart>
      );
      break;
  }
  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      initialDimension={{ width: 850, height: 340 }}
    >
      {chart}
    </ResponsiveContainer>
  );
}
