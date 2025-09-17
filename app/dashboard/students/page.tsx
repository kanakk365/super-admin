"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Search,
  Plus,
  Mail,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { handleApiError, apiClient } from "@/lib/api";
import type { StudentActivityResponse } from "@/lib/types";

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  isVerified: boolean;
}

interface StudentsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: Student[];
}

interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  verified: number;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [createFormData, setCreateFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    email: "",
    institutionId: "",
    standardId: "",
    sectionId: "",
    dob: "",
    gender: "",
    phone: "",
    alternatePhone: "",
    schoolMainId: "",
    photo: null as File | null,
  });

  // Student activity data
  const [studentActivity, setStudentActivity] = useState<StudentActivityResponse | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Check authentication and redirect if needed
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("authToken");
    console.log("Checking auth token:", token ? "Found" : "Not found");

    if (!token) {
      console.log("No token found, redirecting to login");
      router.push("/login");
      return false;
    }
    return true;
  }, [router]);

  // Fetch students from API
  const fetchStudents = useCallback(async () => {
    if (!checkAuth()) return;

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/super-admin/users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: StudentsResponse = await response.json();

      if (data.success) {
        setStudents(data.data);

        // Calculate stats
        const total = data.data.length;
        const active = data.data.filter((student) => student.isActive).length;
        const inactive = data.data.filter((student) => !student.isActive).length;
        const verified = data.data.filter((student) => student.isVerified).length;

        setStats({ total, active, inactive, verified });
      } else {
        setError(data.message || "Failed to fetch students");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  // Filter students based on search term and status
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && student.isActive) ||
      (statusFilter === "INACTIVE" && !student.isActive);

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedStudent(null);
    setStudentActivity(null);
    setActivityLoading(false);
    setViewMode("list");
  };

  // Fetch student activity
  const fetchStudentActivity = useCallback(async (studentId: string) => {
    try {
      setActivityLoading(true);
      const response = await apiClient.getUserActivity(studentId);

      if (response.success && response.data) {
        setStudentActivity(response.data);
      }
    } catch (err) {
      console.error("Error fetching student activity:", err);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Handle student actions
  const handleStudentAction = async (
    studentId: string,
    action: "activate" | "deactivate" | "verify" | "delete" | "view",
    studentName?: string,
  ) => {
    // For view action, fetch student activity and switch to detail view
    if (action === "view") {
      const student = students.find((s) => s.id === studentId);
      if (student) {
        setSelectedStudent(student);
        await fetchStudentActivity(studentId);
        setViewMode("detail");
      }
      return;
    }

    // For delete action, show confirmation
    if (action === "delete") {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${studentName || "this student"}? This action cannot be undone.`,
      );
      if (!confirmDelete) return;
    }

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      // For now, just show success message as these endpoints might not be implemented
      console.log(`Performing ${action} on student ${studentId}`);

      // Refresh students list
      await fetchStudents();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      setError(handleApiError(err));
    }
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCreateFormData((prev) => ({ ...prev, photo: file }));
  };

  // Handle create student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.firstName || !createFormData.lastName || !createFormData.email || !createFormData.password) {
      setError("Please fill in all required fields");
      return;
    }

    setCreateLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      // Create FormData for multipart/form-data (since we have file upload)
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", createFormData.firstName);
      formDataToSend.append("lastName", createFormData.lastName);
      formDataToSend.append("password", createFormData.password);
      formDataToSend.append("email", createFormData.email);
      formDataToSend.append("institutionId", createFormData.institutionId);
      formDataToSend.append("standardId", createFormData.standardId);
      formDataToSend.append("sectionId", createFormData.sectionId);
      formDataToSend.append("dob", createFormData.dob);
      formDataToSend.append("gender", createFormData.gender);
      formDataToSend.append("phone", createFormData.phone);
      formDataToSend.append("alternatePhone", createFormData.alternatePhone || "");
      formDataToSend.append("schoolMainId", createFormData.schoolMainId);

      if (createFormData.photo) {
        formDataToSend.append("photo", createFormData.photo);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/super-admin/users/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Reset form and close dialog
        setCreateFormData({
          firstName: "",
          lastName: "",
          password: "",
          email: "",
          institutionId: "",
          standardId: "",
          sectionId: "",
          dob: "",
          gender: "",
          phone: "",
          alternatePhone: "",
          schoolMainId: "",
          photo: null,
        });
        setShowCreateForm(false);

        // Refresh students list
        await fetchStudents();
      } else {
        setError(data.message || "Failed to create student");
      }
    } catch (err) {
      console.error("Error creating student:", err);
      setError(handleApiError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle form input changes
  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };



  // Load students on component mount
  useEffect(() => {
    // Check auth first, then fetch students
    if (checkAuth()) {
      fetchStudents();
    }
  }, [checkAuth, fetchStudents]);

  function AccordionSection({
    title,
    children,
    defaultOpen = false,
  }: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className="rounded-lg border bg-white">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left"
        >
          <span className="font-medium text-sm sm:text-base text-gray-900">
            {title}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
        {open && <div className="px-4 sm:px-6 pb-5">{children}</div>}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-[calc(100vh-125px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {viewMode === "detail" ? (
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBackToList}>
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl text-neutral-700 font-semibold tracking-tight">
                  Student Details
                </h1>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className=" text-lg text-neutral-700 mr-4">
                  All Students
                </h1>
                <Button
                  variant={statusFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("ALL")}
                  className={
                    statusFilter === "ALL"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={statusFilter === "ACTIVE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={
                    statusFilter === "ACTIVE"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  Active ({stats.active})
                </Button>
                <Button
                  variant={statusFilter === "INACTIVE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("INACTIVE")}
                  className={
                    statusFilter === "INACTIVE"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  Inactive ({stats.inactive})
                </Button>
              </div>
            </div>
          )}
        </div>
        {viewMode === "list" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {!showCreateForm && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-10 w-full h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="whitespace-nowrap"
            >
              {showCreateForm ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  New Student
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Create Student Form */}
      {showCreateForm && (
        <Card className="max-w-7xl mx-auto">
          <CardHeader className="text-left pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Register a new student
            </CardTitle>
            <div className="w-full h-px bg-gray-200 mt-4"></div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStudent} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Enter student's first name (e.g., John)"
                      value={createFormData.firstName}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Enter student's last name (e.g., Doe)"
                      value={createFormData.lastName}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      placeholder="Create a secure password (min. 8 characters)"
                      value={createFormData.password}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="student@example.com"
                      value={createFormData.email}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Institution ID */}
                  <div className="space-y-2">
                    <Label htmlFor="institutionId" className="text-sm font-medium text-gray-700">
                      Institution ID
                    </Label>
                    <Input
                      id="institutionId"
                      name="institutionId"
                      placeholder="Institution UUID (e.g., cmcx8sm3y0000qe0r6xjq6imo)"
                      value={createFormData.institutionId}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Standard ID */}
                  <div className="space-y-2">
                    <Label htmlFor="standardId" className="text-sm font-medium text-gray-700">
                      Standard ID
                    </Label>
                    <Input
                      id="standardId"
                      name="standardId"
                      placeholder="Standard/Grade UUID (e.g., cmen6mrcl0001qezajr3a8s84)"
                      value={createFormData.standardId}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Section ID */}
                  <div className="space-y-2">
                    <Label htmlFor="sectionId" className="text-sm font-medium text-gray-700">
                      Section ID
                    </Label>
                    <Input
                      id="sectionId"
                      name="sectionId"
                      placeholder="Section UUID (e.g., cmen6s8eo0001qe3hgenplbnv)"
                      value={createFormData.sectionId}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-sm font-medium text-gray-700">
                      Date of Birth
                    </Label>
                    <Input
                      id="dob"
                      name="dob"
                      type="date"
                      value={createFormData.dob}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      Gender
                    </Label>
                    <Select
                      value={createFormData.gender}
                      onValueChange={(value) => setCreateFormData((prev) => ({ ...prev, gender: value }))}
                      required
                    >
                      <SelectTrigger
                        className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                        style={{
                          background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                        }}
                      >
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Primary phone number (e.g., +919087654321)"
                      value={createFormData.phone}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Alternate Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="alternatePhone" className="text-sm font-medium text-gray-700">
                      Alternate Phone
                    </Label>
                    <Input
                      id="alternatePhone"
                      name="alternatePhone"
                      placeholder="Alternate phone number (optional)"
                      value={createFormData.alternatePhone}
                      onChange={handleCreateFormChange}
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* School Main ID */}
                  <div className="space-y-2">
                    <Label htmlFor="schoolMainId" className="text-sm font-medium text-gray-700">
                      School Main ID
                    </Label>
                    <Input
                      id="schoolMainId"
                      name="schoolMainId"
                      placeholder="School email address (e.g., contact@school.edu)"
                      value={createFormData.schoolMainId}
                      onChange={handleCreateFormChange}
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="photo" className="text-sm font-medium text-gray-700">
                      Photo
                    </Label>
                    <div className="relative">
                      <Input
                        id="photo"
                        name="photo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400 pr-10"
                        placeholder="Choose student photo (PNG, JPG, JPEG)"
                      />
                      <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {createFormData.photo && (
                      <p className="text-xs text-gray-500">
                        Selected: {createFormData.photo.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="h-10 bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLoading}
                  className="h-10 bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:border-orange-700"
                >
                  {createLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create student"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Students List or Detail View */}
      {!showCreateForm && (
        <>
          {viewMode === "list" ? (
            <Card className="py-0">
              <CardContent className="p-0">
                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && !showCreateForm && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <p className="text-destructive mb-4">{error}</p>
                      <Button
                        onClick={fetchStudents}
                        variant="outline"
                        size="sm"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}

                {/* Students List */}
                {!loading && !error && (
                  <>
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter !== "ALL"
                            ? `No students found matching ${
                                searchTerm ? "your search" : ""
                              }${
                                searchTerm && statusFilter !== "ALL"
                                  ? " and "
                                  : ""
                              }${
                                statusFilter !== "ALL"
                                  ? `status "${statusFilter.toLowerCase()}"`
                                  : ""
                              }.`
                            : "No students found."}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-brand-gradient text-white">
                                <TableHead className="text-white min-w-[200px] px-4">
                                  Student
                                </TableHead>
                                <TableHead className="text-white min-w-[200px] px-4">
                                  Email
                                </TableHead>
                                <TableHead className="text-white min-w-[100px] px-4">
                                  Status
                                </TableHead>
                                <TableHead className="text-white min-w-[100px] px-4">
                                  Verification
                                </TableHead>
                                <TableHead className="text-white text-right min-w-[100px] px-4">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedStudents.map((student) => (
                                <TableRow
                                  key={student.id}
                                  className="hover:bg-gray-50"
                                >
                                  {/* Student Column */}
                                  <TableCell className="px-4">
                                    <div>
                                      <h3 className=" text-base text-gray-900 mb-1">
                                        {student.firstName} {student.lastName}
                                      </h3>
                                    </div>
                                  </TableCell>

                                  {/* Email Column */}
                                  <TableCell className="px-4">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Mail className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate min-w-0">
                                        {student.email}
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* Status Column */}
                                  <TableCell className="px-4">
                                    <Badge
                                      className={`${
                                        student.isActive
                                          ? "bg-transparent text-orange-600 border border-orange-400"
                                          : "bg-gray-200 text-gray-600"
                                      }`}
                                    >
                                      {student.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>

                                  {/* Verification Column */}
                                  <TableCell className="px-4">
                                    <Badge
                                      className={`${
                                        student.isVerified
                                          ? "bg-transparent text-orange-600 border border-orange-400"
                                          : "bg-gray-200 text-gray-600"
                                      }`}
                                    >
                                      {student.isVerified
                                        ? "Verified"
                                        : "Unverified"}
                                    </Badge>
                                  </TableCell>

                                  {/* Actions Column */}
                                  <TableCell className="text-right px-4">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleStudentAction(student.id, "view")
                                      }
                                      className="bg-brand-gradient text-white hover:opacity-90 transition-opacity"
                                    >
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Pagination and Summary */}
                    {filteredStudents.length > 0 && (
                      <div className="flex flex-col gap-4 p-4 bg-gray-50 border-t">
                        

                        {/* Pagination Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Items per page selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Showing:</span>
                            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">of {filteredStudents.length} students</span>
                          </div>

                          {/* Page navigation */}
                          {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>

                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNumber;
                                  if (totalPages <= 5) {
                                    pageNumber = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNumber = i + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNumber = totalPages - 4 + i;
                                  } else {
                                    pageNumber = currentPage - 2 + i;
                                  }

                                  return (
                                    <Button
                                      key={pageNumber}
                                      variant={currentPage === pageNumber ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handlePageChange(pageNumber)}
                                      className={
                                        currentPage === pageNumber
                                          ? "bg-brand-gradient text-white"
                                          : ""
                                      }
                                    >
                                      {pageNumber}
                                    </Button>
                                  );
                                })}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              >
                                Next
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Student Detail View */
            <Card className="py-0">
              <CardContent className="p-8">
                {selectedStudent && (
                  <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-3xl font-medium text-primary">
                            {selectedStudent.firstName.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Student Info */}
                        <div className="flex-1">
                          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </h1>
                          <p className="text-xl text-gray-600 mb-4">
                            Student Account
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`text-sm ${
                          selectedStudent.isActive
                            ? "bg-transparent text-orange-600 border border-orange-400"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {selectedStudent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Accordion sections */}
                    <div className="space-y-3">
                      <AccordionSection title="Overview" defaultOpen>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Mail className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{selectedStudent.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">First Name</span><span>{selectedStudent.firstName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Last Name</span><span>{selectedStudent.lastName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Status</span><Badge className={`${selectedStudent.isActive ? "bg-transparent text-orange-600 border border-orange-400" : "bg-gray-200 text-gray-600"}`}>{selectedStudent.isActive ? "Active" : "Inactive"}</Badge></div>
                            <div className="flex justify-between"><span className="text-gray-600">Email Verified</span><Badge className={`${selectedStudent.isVerified ? "bg-transparent text-orange-600 border border-orange-400" : "bg-gray-200 text-gray-600"}`}>{selectedStudent.isVerified ? "Verified" : "Unverified"}</Badge></div>
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection title="Activity">
                        {studentActivity ? (
                          <div className="space-y-6">
                            {/* Student Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Student Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div><span className="font-medium">Name:</span> {studentActivity.student.name}</div>
                                <div><span className="font-medium">Email:</span> {studentActivity.student.email}</div>
                              </div>
                            </div>

                            {/* Activity Summary */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-4">Activity Summary</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-600">{studentActivity.totals.examsAssigned}</div>
                                  <div className="text-xs text-gray-600">Exams Assigned</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                  <div className="text-2xl font-bold text-green-600">{studentActivity.totals.examsCompleted}</div>
                                  <div className="text-xs text-gray-600">Exams Completed</div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                  <div className="text-2xl font-bold text-yellow-600">{studentActivity.totals.quizSubmissions}</div>
                                  <div className="text-xs text-gray-600">Quiz Submissions</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                  <div className="text-2xl font-bold text-purple-600">{studentActivity.totals.projectsAssigned}</div>
                                  <div className="text-xs text-gray-600">Projects Assigned</div>
                                </div>
                              </div>
                            </div>

                            {/* Exams List */}
                            {studentActivity.exams.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Assigned Exams ({studentActivity.exams.length})</h4>
                                <div className="space-y-3">
                                  {studentActivity.exams.slice(0, 10).map((examData) => (
                                    <div key={examData.id} className="border rounded-lg p-4 bg-white">
                                      <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-medium text-gray-900">{examData.exam.title}</h5>
                                        <Badge className={examData.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                          {examData.completed ? "Completed" : "Pending"}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                                        <div><span className="font-medium">Topic:</span> {examData.exam.topic}</div>
                                        <div><span className="font-medium">Difficulty:</span> {examData.exam.difficulty}</div>
                                        <div><span className="font-medium">Time Limit:</span> {examData.exam.timeLimitMinutes}min</div>
                                      </div>
                                      {examData.score !== null && (
                                        <div className="text-sm">
                                          <span className="font-medium">Score:</span> {examData.score}
                                        </div>
                                      )}
                                      <div className="text-xs text-gray-500 mt-2">
                                        Assigned: {formatDate(examData.createdAt)}
                                      </div>
                                    </div>
                                  ))}
                                  {studentActivity.exams.length > 10 && (
                                    <div className="text-center text-sm text-gray-500">
                                      And {studentActivity.exams.length - 10} more exams...
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Empty States */}
                            {studentActivity.exams.length === 0 && studentActivity.quizzes.length === 0 &&
                             studentActivity.projects.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <p>No activities found for this student.</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            {activityLoading ? (
                              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                Loading activity data...
                              </div>
                            ) : (
                              <p className="text-gray-500">No activity data available.</p>
                            )}
                          </div>
                        )}
                      </AccordionSection>

                      <AccordionSection title="Courses">
                        <p className="text-sm text-gray-600">Coming soon</p>
                      </AccordionSection>

                      <AccordionSection title="Analytics summary">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 mb-1">Created</div>
                            <div>{formatDate(selectedStudent.createdAt)}</div>
                          </div>
                          <div>
                            <div className="text-gray-600 mb-1">Last Updated</div>
                            <div>{selectedStudent.updatedAt ? formatDate(selectedStudent.updatedAt) : "N/A"}</div>
                          </div>
                        </div>
                      </AccordionSection>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                      <Button variant="outline" onClick={handleBackToList}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to List
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
