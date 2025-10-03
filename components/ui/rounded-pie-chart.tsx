"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type PieDatum = { label: string; value: number };

type RoundedPieChartProps = {
  data?: PieDatum[];
  title?: string;
  subtitle?: string;
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function RoundedPieChart({ data, title, subtitle }: RoundedPieChartProps) {
  const defaultData: PieDatum[] = [
    { label: "Math", value: 275 },
    { label: "Science", value: 200 },
    { label: "Social studies", value: 187 },
    { label: "English", value: 173 },
    { label: "UG", value: 120 },
    { label: "PG", value: 90 },
  ];

  const dataset = data && data.length ? data : defaultData;

  const config: ChartConfig = dataset.reduce((acc, d, idx) => {
    acc[d.label] = { label: d.label, color: COLORS[idx % COLORS.length] };
    return acc;
  }, {} as ChartConfig);

  // recharts expects "name" for legend/tooltip label
  const chartData = dataset.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title ?? "Pie Chart - Subjects"}</CardTitle>
        {subtitle && (
          <CardDescription>{subtitle}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[260px] pb-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              label
              strokeWidth={0}
              outerRadius="80%"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


