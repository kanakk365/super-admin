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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {viewMode === "detail" ? (
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBackToList}>
                <X className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Role Details
                </h1>
                <p className="text-muted-foreground">
                  Viewing details for &quot;{selectedRole?.name}&quot;
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Roles & Permissions
                </h1>
                <p className="text-muted-foreground">
                  Manage user roles and their permissions across the platform.
                </p>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={statusFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("ALL")}
                  className={
                    statusFilter === "ALL"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : ""
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
                      ? "bg-orange-500 hover:bg-orange-600"
                      : ""
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
                      ? "bg-orange-500 hover:bg-orange-600"
                      : ""
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
                  className="pl-10 w-full"
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Create New Role</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRole} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter role description"
                  className="min-h-[80px]"
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

              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(
                    ([category, permissions]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="font-medium text-sm text-gray-900">
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-start space-x-2"
                            >
                              <div className="grid gap-1.5 leading-none">
                                <Label
                                  htmlFor={permission.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Role
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
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
            <Card>
              <CardContent className="p-0">
                {/* Table Header - Hidden on mobile, shown as cards instead */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 bg-brand-gradient border-b rounded-md font-medium text-sm text-white m-2">
                  <div className="col-span-1">Icon</div>
                  <div className="col-span-3">Role Name</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-2">Users</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Created</div>
                  <div className="col-span-1">Actions</div>
                </div>

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
                      <div>
                        {filteredRoles.map((role, index) => (
                          <div key={role.id}>
                            {/* Desktop Table Row */}
                            <div
                              className={`hidden lg:grid lg:grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors ${
                                index !== filteredRoles.length - 1
                                  ? "border-b"
                                  : ""
                              }`}
                            >
                              {/* Icon Column */}
                              <div className="col-span-1">
                                <div className="w-12 h-12 bg-orange-100 rounded-md flex items-center justify-center">
                                  <Shield className="h-6 w-6 text-orange-600" />
                                </div>
                              </div>

                              {/* Role Name Column */}
                              <div className="col-span-3">
                                <h3 className="font-semibold text-base text-gray-900 mb-1">
                                  {role.name}
                                </h3>
                                <div className="flex flex-wrap gap-1">
                                  {role.permissions
                                    .slice(0, 2)
                                    .map((permission) => (
                                      <span
                                        key={permission}
                                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                                      >
                                        {availablePermissions.find(
                                          (p) => p.id === permission,
                                        )?.name || permission}
                                      </span>
                                    ))}
                                  {role.permissions.length > 2 && (
                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                      +{role.permissions.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Description Column */}
                              <div className="col-span-3">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {role.description}
                                </p>
                              </div>

                              {/* Users Column */}
                              <div className="col-span-2">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Users className="h-4 w-4 flex-shrink-0" />
                                  <span>{role.userCount} users</span>
                                </div>
                              </div>

                              {/* Status Column */}
                              <div className="col-span-1">
                                <Badge variant={getStatusColor(role.status)}>
                                  {role.status}
                                </Badge>
                              </div>

                              {/* Created Column */}
                              <div className="col-span-1">
                                <div className="text-sm text-gray-600">
                                  {formatDate(role.createdAt)}
                                </div>
                              </div>

                              {/* Actions Column */}
                              <div className="col-span-1">
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleRoleAction(role.id, "view")
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleRoleAction(role.id, "edit")
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Mobile Card Layout */}
                            <div
                              className={`lg:hidden p-4 hover:bg-gray-50 transition-colors ${
                                index !== filteredRoles.length - 1
                                  ? "border-b"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start space-x-4">
                                {/* Icon */}
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Shield className="h-8 w-8 text-orange-600" />
                                  </div>
                                </div>

                                {/* Role Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-lg text-gray-900 truncate pr-2">
                                      {role.name}
                                    </h3>
                                    <Badge
                                      variant={getStatusColor(role.status)}
                                      className="flex-shrink-0"
                                    >
                                      {role.status}
                                    </Badge>
                                  </div>

                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {role.description}
                                  </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                                      <span>{role.userCount} users</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Key className="h-4 w-4 mr-2 flex-shrink-0" />
                                      <span>
                                        {role.permissions.length} permissions
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-1 mb-4">
                                    {role.permissions
                                      .slice(0, 3)
                                      .map((permission) => (
                                        <span
                                          key={permission}
                                          className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                                        >
                                          {availablePermissions.find(
                                            (p) => p.id === permission,
                                          )?.name || permission}
                                        </span>
                                      ))}
                                    {role.permissions.length > 3 && (
                                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                        +{role.permissions.length - 3} more
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleRoleAction(role.id, "view")
                                      }
                                      className="bg-orange-500 text-white hover:bg-orange-600"
                                    >
                                      View Details
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleRoleAction(role.id, "edit")
                                      }
                                    >
                                      Edit
                                    </Button>
                                    {role.name !== "Super Admin" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleRoleAction(role.id, "delete")
                                        }
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Delete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Summary */}
                    {filteredRoles.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 border-t text-sm text-muted-foreground">
                        <div>
                          Showing {filteredRoles.length} of {roles.length} roles
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <span>Total: {stats.total}</span>
                          <span>Active: {stats.active}</span>
                          <span>Users: {stats.totalUsers}</span>
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
              <Card>
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-6">
                        {/* Icon */}
                        <div className="w-24 h-24 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="h-12 w-12 text-orange-600" />
                        </div>

                        {/* Role Info */}
                        <div className="flex-1">
                          <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            {selectedRole.name}
                          </h1>
                          <p className="text-xl text-gray-600 mb-4">
                            {selectedRole.description}
                          </p>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>
                                {selectedRole.userCount} users assigned
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              <span>
                                {selectedRole.permissions.length} permissions
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={getStatusColor(selectedRole.status)}
                        className="text-sm"
                      >
                        {selectedRole.status}
                      </Badge>
                    </div>

                    {/* Permissions */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        Permissions
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(groupedPermissions).map(
                          ([category, permissions]) => {
                            const rolePermissions = permissions.filter((p) =>
                              selectedRole.permissions.includes(p.id),
                            );

                            if (rolePermissions.length === 0) return null;

                            return (
                              <div key={category}>
                                <h4 className="font-medium text-sm text-gray-700 mb-2">
                                  {category}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {rolePermissions.map((permission) => (
                                    <div
                                      key={permission.id}
                                      className="flex items-center gap-3 p-2 bg-white rounded border"
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
                    </div>

                    {/* Meta Information */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        Role Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Created Date</p>
                          <p className="font-medium">
                            {formatDate(selectedRole.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Updated</p>
                          <p className="font-medium">
                            {formatDate(selectedRole.updatedAt)}
                          </p>
                        </div>
                      </div>
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
