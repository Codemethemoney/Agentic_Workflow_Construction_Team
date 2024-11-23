"use client";

import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMetricsStore } from '@/lib/stores/metrics-store';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { Plus, Save, Edit, Trash } from 'lucide-react';

interface ChartConfig {
  id: string;
  type: 'line' | 'area' | 'bar';
  title: string;
  metric: string;
  timeRange: '1h' | '24h' | '7d';
}

export function CustomDashboard() {
  const [editing, setEditing] = useState(false);
  const { metrics } = useMetricsStore();
  const { charts, addChart, removeChart, updateLayout } = useDashboardStore();

  const renderChart = (config: ChartConfig) => {
    const data = metrics[config.metric] || [];

    const ChartComponent = {
      line: LineChart,
      area: AreaChart,
      bar: BarChart,
    }[config.type];

    const DataComponent = {
      line: Line,
      area: Area,
      bar: Bar,
    }[config.type];

    return (
      <Card key={config.id} className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.metric}</CardDescription>
          </div>
          {editing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeChart(config.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ChartComponent data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <DataComponent
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                />
              </ChartComponent>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Custom Dashboard</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setEditing(!editing)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {editing ? 'Done' : 'Edit'}
          </Button>
          {editing && (
            <Button onClick={() => addChart({
              id: Math.random().toString(),
              type: 'line',
              title: 'New Chart',
              metric: 'agent_task_count',
              timeRange: '24h',
            })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Chart
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {charts.map(chart => renderChart(chart))}
      </div>
    </div>
  );
}