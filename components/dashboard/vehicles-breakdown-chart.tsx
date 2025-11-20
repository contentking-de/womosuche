"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface VehiclesBreakdownData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface VehiclesBreakdownChartProps {
  data: VehiclesBreakdownData[];
}

// Sekundärfarbe rgb(20 116 176) und Variationen davon
const COLORS = [
  "rgb(20 116 176)",      // Sekundärfarbe (dunkel)
  "rgb(59 130 246)",      // Etwas heller
  "rgb(96 165 250)",      // Noch heller
  "rgb(147 197 253)",     // Sehr hell
];

export function VehiclesBreakdownChart({ data }: VehiclesBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Noch keine Daten verfügbar
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => {
              return `${name}: ${value} (${percent ? (percent * 100).toFixed(1) : 0}%)`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${value} Vermieter (${((value / total) * 100).toFixed(1)}%)`,
              "Anzahl",
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

