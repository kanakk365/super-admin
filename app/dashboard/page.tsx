"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Users,
  Building2,
  FileText,
  UserPlus,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient, handleApiError } from "@/lib/api";
import DashboardChart from "@/components/ui/dashboard-chart";
import Link from "next/link";
import Image from "next/image";

// (Removed inline Progress component - not needed for current dashboard view)

interface DashboardStats {
  totalStudents: number;
  totalInstitutions: number;
  totalBlogs: number;
  activeFeatures: number; // placeholder until real endpoint
  revenue: number; // monthly revenue placeholder
  studentGrowth: number;
  institutionGrowth: number;
  blogGrowth: number;
}

// RecentActivity removed (not displayed in current layout)

// Chart data shape handled inside component; no explicit interface needed here

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalInstitutions: 0,
    totalBlogs: 0,
    activeFeatures: 0,
    revenue: 0,
    studentGrowth: 0,
    institutionGrowth: 0,
    blogGrowth: 0,
  });
  // Removed recentActivity state (not used in updated design)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChartData, setSelectedChartData] = useState<
    "students" | "institutions" | "blogs"
  >("students");
  const [chartLoading, setChartLoading] = useState(false);
  interface InstitutionRow {
    id: string;
    name?: string;
    institutionName?: string;
    email?: string;
    approvalStatus?: string;
    createdAt?: string;
    created_at?: string;
  }
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const currentYear = new Date().getFullYear();

  const quickActions: QuickAction[] = [
    {
      title: "Add Student",
      description: "Register a new student",
      icon: UserPlus,
      href: "/dashboard/students",
      color: "bg-blue-500",
    },
    {
      title: "New Institution",
      description: "Add an educational institution",
      icon: Building2,
      href: "/dashboard/institutions",
      color: "bg-green-500",
    },
    {
      title: "Create Blog",
      description: "Write a new blog post",
      icon: FileText,
      href: "/dashboard/blogs",
      color: "bg-purple-500",
    },
    {
      title: "Manage Roles",
      description: "Configure user permissions",
      icon: Users,
      href: "/dashboard/roles",
      color: "bg-orange-500",
    },
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard statistics with proper endpoints
      const [institutionsRes, studentsRes, blogsRes] = await Promise.allSettled([
        apiClient.get("/super-admin/institution"),
        apiClient.get("/super-admin/users"),
        apiClient.get("/super-admin/blogs"),
      ]);

      // Get actual student count from users API
      const studentData =
        studentsRes.status === "fulfilled"
          ? (studentsRes.value as { data?: unknown[] })
          : null;
      const studentCount = studentData?.data?.length || 0;

      const institutionData =
        institutionsRes.status === "fulfilled"
          ? (institutionsRes.value as {
              data?: { data?: unknown[]; meta?: { total?: number } };
            })
          : null;
      const institutionCount =
        institutionData?.data?.meta?.total ||
        institutionData?.data?.data?.length ||
        0;

      if (institutionsRes.status === "fulfilled") {
        const instList =
          (institutionsRes.value as { data?: { data?: InstitutionRow[] } })
            ?.data?.data || [];
        setInstitutions(instList);
      } else {
        setInstitutions([]);
      }

      const blogData =
        blogsRes.status === "fulfilled"
          ? (blogsRes.value as { data?: unknown[] })
          : null;
      const blogCount = blogData?.data?.length || 0;

      // Calculate growth percentages based on current vs last week simulation
      const studentGrowth = Math.max(
        0,
        Math.floor(studentCount * 0.15 + (Math.random() * 10 - 5))
      );
      const institutionGrowth = Math.max(
        0,
        Math.floor(institutionCount * 0.08 + (Math.random() * 8 - 4))
      );
      const blogGrowth = Math.max(
        0,
        Math.floor(blogCount * 0.12 + (Math.random() * 12 - 6))
      );

      // Fixed active features count
      const activeFeatures = 8;
      // Fixed revenue (set to 0 as requested)
      const revenue = 0;

      setStats({
        totalStudents: studentCount,
        totalInstitutions: institutionCount,
        totalBlogs: blogCount,
        activeFeatures,
        revenue,
        studentGrowth,
        institutionGrowth,
        blogGrowth,
      });

      // Removed recent activity generation
    } catch (err) {
      setError(handleApiError(err));
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleChartTypeChange = (
    type: "students" | "institutions" | "blogs"
  ) => {
    setSelectedChartData(type);
  };

  // Removed getActivityIcon and getStatusBadge (unused in updated design)

  const monthNames = [
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

  const filteredInstitutions = institutions.filter((inst) => {
    if (monthFilter === "all") return true;
    const created = new Date(inst.createdAt || inst.created_at || Date.now());
    return (
      created.getMonth().toString() === monthFilter &&
      created.getFullYear() === currentYear
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 -mx-4 sm:-mx-6 lg:-mx-8 -my-10 px-12 py-6">
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 -mx-4 sm:-mx-6 lg:-mx-8 -my-10 px-6 md:px-12 py-6">
      <div className="max-w-7xl mx-auto space-y-10 pt-10">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Super Admin Dashboard
          </h1>
          
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">
                    Error loading dashboard data: {error}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDashboardData}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid (4 cards) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Institutions */}
          <Card className="border-0 bg-gray-50 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full flex items-center justify-center  ">
                <Image
                  src="/ins.svg"
                  alt="Institutions"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
              </div>
              <div>
                <p className="text-2xl text-neutral-600 font-semibold  ">
                  {stats.totalInstitutions.toLocaleString()}+
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Institutions
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Students */}
          <Card className="border-0 bg-gray-50 shadow-none ">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-amber-50">
                <Image
                  src="/students.svg"
                  alt="Institutions"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
              </div>
              <div>
                <p className="text-2xl text-neutral-600 font-semibold ">
                  {stats.totalStudents.toLocaleString()}+
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Students
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Active Features */}
          <Card className="border-0 bg-gray-50 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <Image
                  src="/active.svg"
                  alt="Institutions"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
              <div>
                <p className="text-2xl text-neutral-600 font-semibold ">
                  {stats.activeFeatures.toLocaleString()}+
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Active Features
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Revenue */}
          <Card className="border-0 bg-gray-50 shadow-none ">
            <CardContent className="p-4 flex items-center gap-4">
              <Image
                  src="/revenue.svg"
                  alt="Institutions"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
              <div>
                <p className="text-2xl text-neutral-600 font-semibold ">
                  ₹{stats.revenue.toLocaleString()}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Revenue
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Graph */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  Activity Graph
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedChartData}
                  onValueChange={handleChartTypeChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="institutions">Institutions</SelectItem>
                    <SelectItem value="blogs">Blogs</SelectItem>
                  </SelectContent>
                </Select>
                {/* <Select value={"monthly"} onValueChange={() => {}}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Monthly" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select> */}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <DashboardChart
              chartType={selectedChartData}
              loading={chartLoading}
              onLoadingChange={setChartLoading}
            />
          </CardContent>
        </Card>

        {/* Recently added Institutions */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <div>
              <CardTitle className="text-lg">
                Recently added Institutions
              </CardTitle>
            </div>
            <Select
              value={monthFilter}
              onValueChange={(v) => setMonthFilter(v)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {monthNames.map((m, idx) => (
                  <SelectItem key={m} value={idx.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="text-gray-900">Sr no.</TableHead>
                    <TableHead className="text-gray-900">
                      Institution Name
                    </TableHead>
                    <TableHead className="text-gray-900">Email</TableHead>
                    <TableHead className="text-gray-900">Status</TableHead>
                    <TableHead className="text-gray-900 text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstitutions.slice(0, 6).map((inst, i) => (
                    <TableRow key={inst.id || i}>
                      <TableCell className="text-xs font-medium">
                        {(i + 1).toString().padStart(2, "0")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {inst.name || inst.institutionName}
                      </TableCell>
                      <TableCell className="text-xs">
                        {inst.email || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            inst.approvalStatus === "APPROVED"
                              ? "text-green-600 text-xs font-semibold"
                              : inst.approvalStatus === "PENDING"
                              ? "text-amber-600 text-xs font-semibold"
                              : "text-red-600 text-xs font-semibold"
                          }
                        >
                          {inst.approvalStatus || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/institutions`}>
                          <Button
                            size="sm"
                            className="h-7 text-xs px-3 bg-brand-gradient text-white hover:opacity-90 transition-opacity border-0"
                          >
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInstitutions.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-sm text-muted-foreground"
                      >
                        No institutions found for selected month.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
