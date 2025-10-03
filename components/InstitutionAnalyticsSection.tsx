"use client";

import { RefreshCw, Users, GraduationCap, BookOpen, Award } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoundedPieChart } from "@/components/ui/rounded-pie-chart";
import { BarGraphSection } from "@/components/ui/barchart";
import type {
  InstitutionAnalytics,
  InstitutionAnalyticsStudent,
  InstitutionAnalyticsSubjectPerformance,
  SubjectCountSummary,
} from "@/lib/types";

interface InstitutionAnalyticsSectionProps {
  data: InstitutionAnalytics | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void | Promise<void>;
}

const summaryCards = [
  {
    key: "totalStudents" as const,
    title: "Total Students",
    icon: Users,
    accent: "text-blue-600 bg-blue-50",
  },
  {
    key: "totalGrades" as const,
    title: "Total Grades",
    icon: GraduationCap,
    accent: "text-green-600 bg-green-50",
  },
  {
    key: "totalSections" as const,
    title: "Total Sections",
    icon: BookOpen,
    accent: "text-purple-600 bg-purple-50",
  },
  {
    key: "totalTeachers" as const,
    title: "Total Teachers",
    icon: Award,
    accent: "text-amber-600 bg-amber-50",
  },
];

const formatChange = (value: number) => {
  const signed = value >= 0 ? `+${value}` : `${value}`;
  return `${signed} from last month`;
};

const normalizeCount = (item: SubjectCountSummary): number => {
  if (typeof item._count === "number") return item._count;
  if (typeof item.count === "number") return item.count;
  return 0;
};

const subjectLabel = (item: SubjectCountSummary): string =>
  item.subject ?? item.topic ?? "Unknown";

const toPieDataset = (items: SubjectCountSummary[] | undefined) =>
  (items ?? []).map((item) => ({
    label: subjectLabel(item),
    value: normalizeCount(item),
  }));

const hasPieValues = (dataset: Array<{ value: number }>) =>
  dataset.some((entry) => entry.value > 0);

const PieChartCard = ({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: SubjectCountSummary[] | undefined;
}) => {
  const chartData = useMemo(() => toPieDataset(items), [items]);
  const hasValues = hasPieValues(chartData);

  if (!hasValues) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No data available.
        </CardContent>
      </Card>
    );
  }

  return <RoundedPieChart data={chartData} title={title} subtitle={subtitle} />;
};

const formatLastActive = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const statusBadgeClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "active") {
    return "bg-green-100 text-green-700 border-green-200";
  }
  if (normalized === "inactive") {
    return "bg-gray-100 text-gray-600 border-gray-200";
  }
  return "bg-blue-100 text-blue-700 border-blue-200";
};

const LoadingState = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {[0, 1, 2, 3].map((item) => (
      <Card key={item} className="animate-pulse">
        <CardHeader className="space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-6 w-16 rounded bg-gray-200" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-8 w-20 rounded bg-gray-200" />
          <div className="h-3 w-32 rounded bg-gray-200" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const PerformanceTable = ({ data }: { data: InstitutionAnalyticsSubjectPerformance[] }) => {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground">No performance data available yet.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead className="text-right">Excellent</TableHead>
            <TableHead className="text-right">Good</TableHead>
            <TableHead className="text-right">Normal</TableHead>
            <TableHead className="text-right">Dull</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.subject}>
              <TableCell className="font-medium">{row.subject}</TableCell>
              <TableCell className="text-right">{row.excellent}</TableCell>
              <TableCell className="text-right">{row.good}</TableCell>
              <TableCell className="text-right">{row.normal}</TableCell>
              <TableCell className="text-right">{row.dull}</TableCell>
              <TableCell className="text-right">{row.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const StudentsTable = ({ students }: { students: InstitutionAnalyticsStudent[] }) => {
  if (!students.length) {
    return <p className="text-sm text-muted-foreground">No recent student activity recorded.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Total Score</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{student.email}</TableCell>
              <TableCell>{student.grade}</TableCell>
              <TableCell>{student.section}</TableCell>
              <TableCell>{student.totalScore}</TableCell>
              <TableCell>{student.attendance}</TableCell>
              <TableCell>
                <Badge className={statusBadgeClass(student.status)}>{student.status}</Badge>
              </TableCell>
              <TableCell>{formatLastActive(student.lastActive)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const InstitutionAnalyticsSection = ({ data, isLoading, error, onRetry }: InstitutionAnalyticsSectionProps) => {
  const performanceChartData = useMemo(() => {
    if (!data) {
      return [] as Array<{
        subject: string;
        dull: number;
        normal: number;
        good: number;
        excellent: number;
      }>;
    }

    return data.performanceBySubject.map((item) => ({
      subject: item.subject ?? "Unknown",
      dull: item.dull ?? 0,
      normal: item.normal ?? 0,
      good: item.good ?? 0,
      excellent: item.excellent ?? 0,
    }));
  }, [data]);

  const gradeOptions = useMemo(() => {
    if (!data) return [] as Array<{ id: string; name: string }>;
    const unique = new Map<string, string>();
    data.students.forEach((student) => {
      if (student.grade) {
        unique.set(student.grade, student.grade);
      }
    });
    return Array.from(unique.keys()).map((grade) => ({ id: grade, name: grade }));
  }, [data]);

  const sectionOptions = useMemo(() => {
    if (!data) return [] as Array<{ id: string; name: string }>;
    const unique = new Map<string, string>();
    data.students.forEach((student) => {
      if (student.section) {
        unique.set(student.section, student.section);
      }
    });
    return Array.from(unique.keys()).map((section) => ({ id: section, name: section }));
  }, [data]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold text-red-700">Failed to load analytics</CardTitle>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={() => void onRetry()} className="gap-1">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">No analytics available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Choose an institution to view its latest analytics snapshot.
          </p>
        </CardContent>
      </Card>
    );
  }

  const summaryValues = summaryCards.map((card) => ({
    ...card,
    value: data.summary[card.key].count,
    change: data.summary[card.key].changeFromLastMonth,
  }));

  const totalStudentsCount = data.students.length;
  const visibleStudents = data.students.slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryValues.map(({ key, title, icon: Icon, accent, value, change }) => (
          <Card key={key} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <span className={`rounded-md p-2 ${accent}`}>
                <Icon className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{value}</div>
              <p className="mt-2 text-xs text-muted-foreground">{formatChange(change)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {performanceChartData.length ? (
        <BarGraphSection
          performanceData={performanceChartData}
          grades={gradeOptions}
          sections={sectionOptions}
          enableFilters={false}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance by subject</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No performance data available.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Total statistics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PieChartCard title="Total Exams" subtitle="By subject" items={data.totalStatistics.examsBySubject} />
          <PieChartCard title="Total Quizzes" subtitle="By subject" items={data.totalStatistics.quizzesBySubject} />
          <PieChartCard title="Total Projects" subtitle="By subject" items={data.totalStatistics.projectsBySubject} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <PieChartCard
            title="Customized Exams"
            subtitle="Total assigned"
            items={data.totalStatistics.customizedExamsBySubject}
          />
          <PieChartCard
            title="Customized Quizzes"
            subtitle="Total assigned"
            items={data.totalStatistics.customizedQuizzesBySubject}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Today&apos;s activity</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PieChartCard title="Today&apos;s Exams" subtitle="By subject" items={data.todayStatistics.examsBySubject} />
          <PieChartCard title="Today&apos;s Quizzes" subtitle="By subject" items={data.todayStatistics.quizzesBySubject} />
          <PieChartCard title="Today&apos;s Projects" subtitle="By subject" items={data.todayStatistics.projectsBySubject} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <PieChartCard
            title="Today&apos;s Customized Exams"
            subtitle="By subject"
            items={data.todayStatistics.customizedExamsBySubject}
          />
          <PieChartCard
            title="Today&apos;s Customized Quizzes"
            subtitle="By subject"
            items={data.todayStatistics.customizedQuizzesBySubject}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Students ({totalStudentsCount} total, showing {visibleStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StudentsTable students={visibleStudents} />
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionAnalyticsSection;
