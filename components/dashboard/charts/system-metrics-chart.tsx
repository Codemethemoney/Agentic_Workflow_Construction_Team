"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";

interface SystemMetricsChartProps {
  data: Array<{
    time: string;
    systemLoad: number;
    responseTime: number;
  }>;
}

export function SystemMetricsChart({ data }: SystemMetricsChartProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">System Load & Response Time</h4>
        <Badge variant="outline" className="font-mono text-xs">
          24h
        </Badge>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
            <Line
              type="monotone"
              dataKey="systemLoad"
              stroke="hsl(var(--blue-500))"
              strokeWidth={2}
              dot={false}
              name="System Load"
            />
            <Line
              type="monotone"
              dataKey="responseTime"
              stroke="hsl(var(--green-500))"
              strokeWidth={2}
              dot={false}
              name="Response Time"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}