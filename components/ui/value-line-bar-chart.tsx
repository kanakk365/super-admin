"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, ReferenceLine } from "recharts";
import React from "react";
import { AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JetBrains_Mono } from "next/font/google";
import { useMotionValueEvent, useSpring } from "framer-motion";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CHART_MARGIN = 35;

// Data shape coming from backend assumed as: { data: [{ month: "2025-01", value: 123 }, ...] }
// We'll normalize into { month: 'January', desktop: number }
interface MonthlyMetricRaw { month: string; value: number }
interface MonthlyMetricsResponse { data?: MonthlyMetricRaw[] }

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseMonthLabel(monthKey: string) {
  // Accept formats like '2025-01', '01', 'January'
  if (/^\d{4}-\d{2}$/.test(monthKey)) {
    const m = parseInt(monthKey.split("-")[1], 10) - 1;
    return MONTH_NAMES[m] || monthKey;
  }
  if (/^\d{2}$/.test(monthKey)) {
    const m = parseInt(monthKey, 10) - 1;
    return MONTH_NAMES[m] || monthKey;
  }
  const capitalized = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
  return MONTH_NAMES.includes(capitalized) ? capitalized : monthKey;
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--secondary-foreground)",
  },
} satisfies ChartConfig;

export function ValueLineBarChart() {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);
  const [chartData, setChartData] = React.useState<{ month: string; desktop: number }[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch monthly analytics
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/super-admin/analytics/monthly"); // local API route you should implement proxying to backend
        if (!res.ok) throw new Error("Failed to load analytics");
        const json: MonthlyMetricsResponse = await res.json();
        const normalized = (json.data || []).map((d) => ({
          month: parseMonthLabel(d.month),
          desktop: d.value ?? 0,
        }));
        if (!cancelled) setChartData(normalized);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxValueIndex = React.useMemo(() => {
    if (!chartData.length) return { index: 0, value: 0 };
    if (activeIndex !== undefined) {
      return { index: activeIndex, value: chartData[activeIndex]?.desktop ?? 0 };
    }
    return chartData.reduce<{ index: number; value: number }>(
      (max, data, index) => (data.desktop > max.value ? { index, value: data.desktop } : max),
      { index: 0, value: chartData[0].desktop }
    );
  }, [activeIndex, chartData]);

  const maxValueIndexSpring = useSpring(maxValueIndex.value, {
    stiffness: 100,
    damping: 20,
  });

  const [springyValue, setSpringyValue] = React.useState(maxValueIndex.value);

  useMotionValueEvent(maxValueIndexSpring, "change", (latest) => {
    const num = typeof latest === "number" ? latest : parseFloat(String(latest));
    if (!isNaN(num)) setSpringyValue(Math.round(num));
  });

  React.useEffect(() => {
    maxValueIndexSpring.set(maxValueIndex.value);
  }, [maxValueIndex.value, maxValueIndexSpring]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className={cn(jetBrainsMono.className, "text-2xl tracking-tighter")}
          >
            {loading ? "..." : `$${maxValueIndex.value}`}
          </span>
          <Badge variant="secondary">
            <TrendingUp className="h-4 w-4" />
            <span>5.2%</span>
          </Badge>
        </CardTitle>
        <CardDescription>vs. last quarter</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-2 text-xs text-destructive">{error}</div>
        )}
        <AnimatePresence mode="wait">
          {chartData.length > 0 && (
            <ChartContainer config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={chartData}
                onMouseLeave={() => setActiveIndex(undefined)}
                margin={{ left: CHART_MARGIN }}
              >
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value: string) => value.slice(0, 3)}
                />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}>
                  {chartData.map((_, index) => (
                    <Cell
                      className="duration-200"
                      opacity={index === maxValueIndex.index ? 1 : 0.2}
                      key={index}
                      onMouseEnter={() => setActiveIndex(index)}
                    />
                  ))}
                </Bar>
                <ReferenceLine
                  opacity={0.4}
                  y={springyValue}
                  stroke="var(--secondary-foreground)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={<CustomReferenceLabel value={maxValueIndex.value} />}
                />
              </BarChart>
            </ChartContainer>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

interface CustomReferenceLabelProps {
  viewBox?: {
    x?: number;
    y?: number;
  };
  value: number;
}

const CustomReferenceLabel: React.FC<CustomReferenceLabelProps> = (props) => {
  const { viewBox, value } = props;
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;

  // we need to change width based on value length
  const width = React.useMemo(() => {
    const characterWidth = 8; // Average width of a character in pixels
    const padding = 10;
    return value.toString().length * characterWidth + padding;
  }, [value]);

  return (
    <>
      <rect
        x={x - CHART_MARGIN}
        y={y - 9}
        width={width}
        height={18}
        fill="var(--secondary-foreground)"
        rx={4}
      />
      <text
        fontWeight={600}
        x={x - CHART_MARGIN + 6}
        y={y + 4}
        fill="var(--primary-foreground)"
      >
        {value}
      </text>
    </>
  );
};
