import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Slice } from "../aggregate";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(280 70% 55%)",
  "hsl(200 80% 55%)",
  "hsl(150 60% 50%)",
  "hsl(20 90% 55%)",
  "hsl(340 75% 55%)",
];

export function DonutChart({ data }: { data: Slice[] }) {
  const top = data.slice(0, 6);
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={top} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {top.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
