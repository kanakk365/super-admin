"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  X,
  Eye,
  Edit,
  Trash2,
  Shield,
  Users,
  Key,
  UserCheck,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
// import { Checkbox } from "@/components/ui/checkbox";

// Types
interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  status: "ACTIVE" | "INACTIVE";
}

interface RoleStats {
  total: number;
  active: number;
  inactive: number;
  totalUsers: number;
}

// Available permissions
const availablePermissions = [
  {
    id: "read",
    name: "Read Access",
    description: "View system data and reports",
    category: "Basic",
  },
  {
    id: "write",
    name: "Write Access",
    description: "Create and edit content",
    category: "Basic",
  },
  {
    id: "delete",
    name: "Delete Access",
    description: "Remove data from system",
    category: "Basic",
  },
  {
    id: "manage_users",
    name: "Manage Users",
    description: "Add, edit, and remove users",
    category: "User Management",
  },
  {
    id: "manage_institutions",
    name: "Manage Institutions",
    description: "Control institution settings",
    category: "Institution Management",
  },
  {
    id: "manage_students",
    name: "Manage Students",
    description: "Handle student data and enrollment",
    category: "Student Management",
  },
  {
    id: "manage_blogs",
    name: "Manage Blogs",
    description: "Create and publish blog content",
    category: "Content Management",
  },
  {
    id: "view_reports",
    name: "View Reports",
    description: "Access analytics and reports",
    category: "Analytics",
  },
  {
    id: "system_config",
    name: "System Configuration",
    description: "Modify system settings",
    category: "System",
  },
  {
    id: "publish_content",
    name: "Publish Content",
    description: "Approve and publish content",
    category: "Content Management",
  },
  {
    id: "view_students",
    name: "View Students",
    description: "View student information",
    category: "Student Management",
  },
  {
    id: "send_messages",
    name: "Send Messages",
    description: "Communicate with users",
    category: "Communication",
  },
];

// Helper function for API error handling
const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [stats, setStats] = useState<RoleStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalUsers: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    permissions: [],
    status: "ACTIVE",
  });

  // Initialize with default roles
  useEffect(() => {
    const defaultRoles: Role[] = [
      {
        id: "1",
        name: "Super Admin",
        description: "Full system access with all permissions",
        userCount: 2,
        permissions: [
          "read",
          "write",
          "delete",
          "manage_users",
          "manage_institutions",
          "manage_blogs",
          "system_config",
          "view_reports",
          "publish_content",
          "manage_students",
          "view_students",
          "send_messages",
        ],
        status: "ACTIVE",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "Admin",
        description: "Administrative access to manage institutions and users",
        userCount: 8,
        permissions: [
          "read",
          "write",
          "manage_users",
          "manage_institutions",
          "manage_students",
          "view_students",
          "view_reports",
          "send_messages",
        ],
        status: "ACTIVE",
        createdAt: "2023-01-15T00:00:00Z",
        updatedAt: "2023-01-15T00:00:00Z",
      },
      {
        id: "3",
        name: "Content Editor",
        description: "Create and manage blog content and articles",
        userCount: 5,
        permissions: [
          "read",
          "write",
          "manage_blogs",
          "publish_content",
          "view_reports",
        ],
        status: "ACTIVE",
        createdAt: "2023-02-01T00:00:00Z",
        updatedAt: "2023-02-01T00:00:00Z",
      },
    ];

    setRoles(defaultRoles);

    // Calculate stats
    const totalUsers = defaultRoles.reduce(
      (sum, role) => sum + role.userCount,
      0,
    );
    const activeRoles = defaultRoles.filter(
      (role) => role.status === "ACTIVE",
    ).length;
    const inactiveRoles = defaultRoles.filter(
      (role) => role.status === "INACTIVE",
    ).length;

    setStats({
      total: defaultRoles.length,
      active: activeRoles,
      inactive: inactiveRoles,
      totalUsers,
    });

    setLoading(false);
  }, []);

  // Create new role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setCreateLoading(true);
      setError("");

      // Create new role
      const newRole: Role = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        userCount: 0,
        permissions: formData.permissions,
        status: formData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRoles((prev) => [...prev, newRole]);

      // Update stats
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        active: formData.status === "ACTIVE" ? prev.active + 1 : prev.active,
        inactive:
          formData.status === "INACTIVE" ? prev.inactive + 1 : prev.inactive,
      }));

      // Reset form
      setFormData({
        name: "",
        description: "",
        permissions: [],
        status: "ACTIVE",
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error("Error creating role:", err);
      setError(handleApiError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle permission change
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter((p) => p !== permissionId),
    }));
  };

  // Filter roles based on search term and status
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || role.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

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

  // Handle role actions
  const handleRoleAction = async (
    roleId: string,
    action: "view" | "edit" | "delete",
  ) => {
    switch (action) {
      case "view":
        const role = roles.find((r) => r.id === roleId);
        if (role) {
          setSelectedRole(role);
          setViewMode("detail");
        }
        break;
      case "edit":
        // Handle edit logic here
        break;
      case "delete":
        if (confirm("Are you sure you want to delete this role?")) {
          setRoles((prev) => prev.filter((r) => r.id !== roleId));
          // Update stats
          const deletedRole = roles.find((r) => r.id === roleId);
          if (deletedRole) {
            setStats((prev) => ({
              ...prev,
              total: prev.total - 1,
              active:
                deletedRole.status === "ACTIVE" ? prev.active - 1 : prev.active,
              inactive:
                deletedRole.status === "INACTIVE"
                  ? prev.inactive - 1
                  : prev.inactive,
              totalUsers: prev.totalUsers - deletedRole.userCount,
            }));
          }
        }
        break;
    }
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedRole(null);
    setViewMode("list");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "INACTIVE":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce(
    (acc, permission) => {
      const category = permission.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, typeof availablePermissions>,
  );

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
                  Role Details
                </h1>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className=" text-lg text-neutral-700 mr-4">
                  All Roles
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
                  placeholder="Search roles..."
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
                  New Role
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Create Role Form */}
      {showCreateForm && (
        <Card className="max-w-7xl mx-auto">
          <CardHeader className="text-left pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Create a new role
            </CardTitle>
            <div className="w-full h-px bg-gray-200 mt-4"></div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRole} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Role Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Role Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter role name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400" style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Enter role description"
                      className="min-h-[100px] border-0 focus:border-orange-400 focus:ring-orange-400 resize-none"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      required
                    />
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
                    "Create role"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Roles List or Detail View */}
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
                      <Button variant="outline" size="sm">
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}

                {/* Roles List */}
                {!loading && !error && (
                  <>
                    {filteredRoles.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter !== "ALL"
                            ? `No roles found matching ${
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
                            : "No roles found."}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-brand-gradient text-white">
                                <TableHead className="text-white min-w-[200px] px-4">
                                  Role Name
                                </TableHead>
                                <TableHead className="text-white min-w-[120px] px-4">
                                  Assigned Users
                                </TableHead>
                                <TableHead className="text-white min-w-[250px] px-4">
                                  Permission Summary
                                </TableHead>
                                <TableHead className="text-white text-right min-w-[100px] px-4">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedRoles.map((role) => (
                                <TableRow
                                  key={role.id}
                                  className="hover:bg-gray-50"
                                >
                                  {/* Role Name Column */}
                                  <TableCell className="px-4">
                                    <h3 className="text-base text-gray-900">
                                      {role.name}
                                    </h3>
                                  </TableCell>

                                  {/* Assigned Users Column */}
                                  <TableCell className="px-4">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Users className="h-4 w-4 flex-shrink-0" />
                                      <span>{role.userCount} users</span>
                                    </div>
                                  </TableCell>

                                  {/* Permission Summary Column */}
                                  <TableCell className="px-4">
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {role.description}
                                    </p>
                                  </TableCell>

                                  {/* Actions Column */}
                                  <TableCell className="text-right px-4">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleRoleAction(role.id, "view")
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
                    {filteredRoles.length > 0 && (
                      <div className="flex flex-col gap-4 p-4 bg-gray-50 border-t">
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
                            <span className="text-sm text-muted-foreground">of {filteredRoles.length} roles</span>
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
            /* Role Detail View */
            selectedRole && (
              <Card className="py-0">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-6">
                        {/* Icon */}
                        <div className="w-20 h-20 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="h-12 w-12 text-orange-600" />
                        </div>

                        {/* Role Info */}
                        <div className="flex-1">
                          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                            {selectedRole.name}
                          </h1>
                          <p className="text-xl text-gray-600 mb-4">
                            Role
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={getStatusColor(selectedRole.status)}
                        className="text-sm"
                      >
                        {selectedRole.status}
                      </Badge>
                    </div>

                    {/* Accordion sections */}
                    <div className="space-y-3">
                      <AccordionSection title="Overview" defaultOpen>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Shield className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Role Name</p>
                                <p className="font-medium">{selectedRole.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Users Assigned</p>
                                <p className="font-medium">{selectedRole.userCount} users</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Status</span><Badge variant={getStatusColor(selectedRole.status)}>{selectedRole.status}</Badge></div>
                            <div className="flex justify-between"><span className="text-gray-600">Permissions</span><span>{selectedRole.permissions.length} permissions</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Created</span><span>{formatDate(selectedRole.createdAt)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Updated</span><span>{formatDate(selectedRole.updatedAt)}</span></div>
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection title="Description">
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                            {selectedRole.description}
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection title="Permissions">
                        <div className="space-y-4">
                          {Object.entries(groupedPermissions).map(
                            ([category, permissions]) => {
                              const rolePermissions = permissions.filter((p) =>
                                selectedRole.permissions.includes(p.id),
                              );

                              if (rolePermissions.length === 0) return null;

                              return (
                                <div key={category}>
                                  <h4 className="font-medium text-sm text-gray-700 mb-3">
                                    {category}
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {rolePermissions.map((permission) => (
                                      <div
                                        key={permission.id}
                                        className="flex items-center gap-3 p-3 bg-white rounded border"
                                      >
                                        <Key className="h-4 w-4 text-gray-400" />
                                        <div>
                                          <p className="font-medium text-sm">
                                            {permission.name}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {permission.description}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            },
                          )}
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
            )
          )}
        </>
      )}
    </div>
  );
}
