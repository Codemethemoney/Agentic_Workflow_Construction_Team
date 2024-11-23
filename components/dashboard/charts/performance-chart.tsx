"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";

interface PerformanceChartProps {
  data: Array<{
    time: string;
    successRate: number;
    throughput: number;
  }>;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Success Rate & Throughput</h4>
        <Badge variant="outline" className="font-mono text-xs">
          24h
        </Badge>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
            <XAxis 
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={true}
              tickSize={5}
              tickMargin={5}
              height={40}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={true}
              tickSize={5}
              tickMargin={5}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Area
              type="monotone"
              dataKey="successRate"
              stroke="hsl(var(--purple-500))"
              fill="hsl(var(--purple-500))"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={false}
              name="Success Rate"
            />
            <Area
              type="monotone"
              dataKey="throughput"
              stroke="hsl(var(--amber-500))"
              fill="hsl(var(--amber-500))"
              fillOpacity={0.1}
              strokeWidth={2}
              dot={false}
              name="Throughput"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}