"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

import { apiClient, handleApiError } from "@/lib/api";
import type { Institution } from "@/lib/types";

// Types
interface InstitutionStats {
  total: number;
  approved: number;
  pending: number;
  suspended: number;
}

// Available roles for super institution admin
const availableRoles = [
  {
    value: "SUPER_INSTITUTION_ADMIN",
    label: "Super Institution Admin",
    description: "Full access to institution management and admin functions",
  },
];

// Removed mock data - now using API

export default function SuperInstitutionAdminPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [stats, setStats] = useState<InstitutionStats>({
    total: 0,
    approved: 0,
    pending: 0,
    suspended: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "APPROVED" | "PENDING" | "SUSPENDED"
  >("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SUPER_INSTITUTION_ADMIN",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInstitutions = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiClient.getSuperInstitutionAdminsInstitutions(currentPage, itemsPerPage);

      if (response.success && response.data) {
        setInstitutions(response.data.data || []);

        // Calculate stats
        const total = response.data.meta.total;
        const approved = response.data.data.filter((inst) => inst.approvalStatus === "APPROVED").length;
        const pending = response.data.data.filter((inst) => inst.approvalStatus === "PENDING").length;
        const suspended = response.data.data.filter((inst) => inst.isSuspended).length;
        setStats({ total, approved, pending, suspended });
      } else {
        setInstitutions([]);
        setStats({ total: 0, approved: 0, pending: 0, suspended: 0 });
      }
    } catch (error) {
      console.error("Failed to load institutions:", error);
      setError(handleApiError(error));
      setInstitutions([]);
      setStats({ total: 0, approved: 0, pending: 0, suspended: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  const handleCreateAdmin = async () => {
    try {
      setIsSubmitting(true);
      setFormErrors({});
      setError("");

      // Validate form
      const errors: Record<string, string> = {};
      if (!formData.name.trim()) errors.name = "Name is required";
      if (!formData.email.trim()) errors.email = "Email is required";
      if (!formData.password.trim()) errors.password = "Password is required";
      if (formData.password.length < 6)
        errors.password = "Password must be at least 6 characters";

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      // Call API
      const response = await apiClient.registerSuperInstitutionAdmin(formData);

      if (response.success) {
        setError(""); // Clear any previous errors
        alert("Super Institution Admin created successfully");
        setShowCreateForm(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "SUPER_INSTITUTION_ADMIN",
        });
        loadInstitutions(); // Refresh the list
      } else {
        setError(response.message || "Failed to create admin");
      }
    } catch (err) {
      console.error("Failed to create admin:", err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewInstitution = (institution: Institution) => {
    setSelectedInstitution(institution);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setSelectedInstitution(null);
    setViewMode("list");
  };

  const filteredInstitutions = institutions.filter((institution) => {
    const matchesSearch =
      institution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      institution.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "APPROVED" && institution.approvalStatus === "APPROVED") ||
      (statusFilter === "PENDING" && institution.approvalStatus === "PENDING") ||
      (statusFilter === "SUSPENDED" && institution.isSuspended);

    return matchesSearch && matchesStatus;
  });

  const paginatedInstitutions = filteredInstitutions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInstitutions.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
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
                  Institution Details
                </h1>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg text-neutral-700 mr-4">
                  All Institutions
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
                  variant={statusFilter === "APPROVED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("APPROVED")}
                  className={
                    statusFilter === "APPROVED"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  Approved ({stats.approved})
                </Button>
                <Button
                  variant={statusFilter === "PENDING" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("PENDING")}
                  className={
                    statusFilter === "PENDING"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  Pending ({stats.pending})
                </Button>
                <Button
                  variant={statusFilter === "SUSPENDED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("SUSPENDED")}
                  className={
                    statusFilter === "SUSPENDED"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  Suspended ({stats.suspended})
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
                  placeholder="Search institutions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                  }}
                />
              </div>
            )}
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="whitespace-nowrap"
              disabled
            >
              {showCreateForm ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Institution
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Create Super Institution Admin Form */}
      {showCreateForm && (
        <Card className="max-w-7xl mx-auto">
          <CardHeader className="text-left pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Register a new super institution admin
            </CardTitle>
            <div className="w-full h-px bg-gray-200 mt-4"></div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter full name"
                      className={`h-11 border-0 focus:border-orange-400 focus:ring-orange-400 ${
                        formErrors.name ? "border-red-500" : ""
                      }`}
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                    {formErrors.name && (
                      <span className="text-sm text-red-500">
                        {formErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter Email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className={`h-11 border-0 focus:border-orange-400 focus:ring-orange-400 ${
                        formErrors.email ? "border-red-500" : ""
                      }`}
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                    {formErrors.email && (
                      <span className="text-sm text-red-500">
                        {formErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className={`h-11 border-0 focus:border-orange-400 focus:ring-orange-400 ${
                        formErrors.password ? "border-red-500" : ""
                      }`}
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                    {formErrors.password && (
                      <span className="text-sm text-red-500">
                        {formErrors.password}
                      </span>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="role"
                      className="text-sm font-medium text-gray-700"
                    >
                      Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger
                        className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                        }}
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  onClick={() => {
                    setShowCreateForm(false);
                    setError("");
                  }}
                  className="h-10 bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:border-orange-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Admin"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Admins List or Detail View */}
      {!showCreateForm && viewMode === "list" && (
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="p-2">
                    <TableRow className="bg-brand-gradient text-white p-2">
                      <TableHead className="text-white">Institution Name</TableHead>
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Board</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInstitutions.map((institution) => (
                      <TableRow key={institution.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{institution.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{institution.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{institution.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{institution.affiliatedBoard}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              institution.approvalStatus === "APPROVED"
                                ? "bg-transparent text-green-600 border border-green-400"
                                : institution.approvalStatus === "PENDING"
                                ? "bg-transparent text-yellow-600 border border-yellow-400"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {institution.approvalStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleViewInstitution(institution)}
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

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-2">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Showing:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger
                    className="w-20 border-0 focus:border-orange-400 focus:ring-orange-400"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                    }}
                  >
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
                <span className="text-sm text-muted-foreground">
                  of {filteredInstitutions.length} institutions
                </span>
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
                          variant={
                            currentPage === pageNumber ? "default" : "outline"
                          }
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
          </CardContent>
        </Card>
      )}

      {/* Detail View */}
      {!showCreateForm && viewMode === "detail" && selectedInstitution && (
        <Card className="py-0">
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Header Section */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  {/* Logo/Avatar */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {selectedInstitution.logoUrl ? (
                      <Image
                        src={selectedInstitution.logoUrl}
                        alt={selectedInstitution.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-3xl font-medium text-primary">
                        {selectedInstitution.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Institution Info */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                      {selectedInstitution.name}
                    </h1>
                    <p className="text-xl text-gray-600 mb-4">
                      {selectedInstitution.type} - {selectedInstitution.affiliatedBoard}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`text-sm ${
                    selectedInstitution.approvalStatus === "APPROVED"
                      ? "bg-transparent text-green-600 border border-green-400"
                      : selectedInstitution.approvalStatus === "PENDING"
                      ? "bg-transparent text-yellow-600 border border-yellow-400"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {selectedInstitution.approvalStatus}
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
                          <p className="font-medium">{selectedInstitution.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-medium">{selectedInstitution.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="h-5 w-5 text-gray-400">📚</span>
                        <div>
                          <p className="text-sm text-gray-600">Board</p>
                          <p className="font-medium">{selectedInstitution.affiliatedBoard}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <Badge
                          className={`${
                            selectedInstitution.approvalStatus === "APPROVED"
                              ? "bg-transparent text-green-600 border border-green-400"
                              : selectedInstitution.approvalStatus === "PENDING"
                              ? "bg-transparent text-yellow-600 border border-yellow-400"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {selectedInstitution.approvalStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Students</span>
                        <span>{selectedInstitution.totalStudentStrength}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Established</span>
                        <span>{selectedInstitution.yearOfEstablishment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created</span>
                        <span>{formatDate(selectedInstitution.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection title="Contact Information">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">📞</span>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{selectedInstitution.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">🌐</span>
                      <div>
                        <p className="text-sm text-gray-600">Website</p>
                        <p className="font-medium">
                          {selectedInstitution.website ? (
                            <a
                              href={selectedInstitution.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedInstitution.website}
                            </a>
                          ) : (
                            "Not provided"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">📍</span>
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">{selectedInstitution.address}</p>
                      </div>
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection title="Documents">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">📄</span>
                      <div>
                        <p className="text-sm text-gray-600">Proof of Institution</p>
                        <p className="font-medium">
                          {selectedInstitution.proofOfInstitutionUrl ? (
                            <a
                              href={selectedInstitution.proofOfInstitutionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Document
                            </a>
                          ) : (
                            "Not uploaded"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection title="Institution Details">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">Created</div>
                      <div>{formatDate(selectedInstitution.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Last Updated</div>
                      <div>{formatDate(selectedInstitution.updatedAt)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">POC Name</div>
                      <div>{selectedInstitution.pocName || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Suspended</div>
                      <div>{selectedInstitution.isSuspended ? "Yes" : "No"}</div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
