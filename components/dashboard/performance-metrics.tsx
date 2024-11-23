"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Server, Clock } from "lucide-react";
import { SystemMetricsChart } from "./charts/system-metrics-chart";
import { PerformanceChart } from "./charts/performance-chart";

// Generate realistic 24-hour performance data
const generatePerformanceData = () => {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      systemLoad: 65 + Math.random() * 20,
      responseTime: 120 + Math.random() * 80,
      successRate: 95 + Math.random() * 5,
      throughput: 800 + Math.random() * 400,
    });
  }
  return data;
};

const performanceData = generatePerformanceData();

const metrics = [
  {
    title: "System Load",
    value: "78%",
    change: "+2.5%",
    icon: Server,
    color: "text-blue-500",
  },
  {
    title: "Response Time",
    value: "145ms",
    change: "-12ms",
    icon: Clock,
    color: "text-green-500",
  },
  {
    title: "Success Rate",
    value: "99.2%",
    change: "+0.3%",
    icon: Activity,
    color: "text-purple-500",
  },
  {
    title: "Throughput",
    value: "950/s",
    change: "+50/s",
    icon: Zap,
    color: "text-amber-500",
  },
];

export function PerformanceMetrics() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance</CardTitle>
            <CardDescription>24-hour system metrics</CardDescription>
          </div>
          <Badge variant="secondary" className="font-mono">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.title}
                className="flex flex-col space-y-2 p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  <span className="text-sm font-medium">{metric.title}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <span className={`text-xs ${
                    metric.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-2 gap-4 h-[300px]">
            <SystemMetricsChart data={performanceData} />
            <PerformanceChart data={performanceData} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}