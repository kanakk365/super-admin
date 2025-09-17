"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  X,
  Shield,
  UserCheck,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react";
import { handleApiError, apiClient } from "@/lib/api";
import type { Member } from "@/lib/types";
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
// import { Checkbox } from "@/components/ui/checkbox";

// Types

interface MembersApiResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  phone: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

interface MemberFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleName: string;
  password: string;
}

interface MemberStats {
  total: number;
  uniqueRoles: number;
  totalMembers: number;
}



export default function RolesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [stats, setStats] = useState<MemberStats>({
    total: 0,
    uniqueRoles: 0,
    totalMembers: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<MemberFormData>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    roleName: "",
    password: "",
  });

  // Fetch members from API
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.getRolesUnderAdmin();

      if (response.success && response.data) {
        // Map API response to Member objects
        const apiMembers: Member[] = response.data.map((member: MembersApiResponse) => ({
          id: member.id,
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          roleName: member.roleName,
          phone: member.phone,
          adminId: member.adminId,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        }));

        setMembers(apiMembers);

        // Calculate stats
        const uniqueRoles = new Set(apiMembers.map(member => member.roleName)).size;

        setStats({
          total: apiMembers.length,
          uniqueRoles,
          totalMembers: apiMembers.length,
        });
      } else {
        setError(response.message || "Failed to fetch members");
      }
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize members on component mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Create new member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.email || !formData.firstName || !formData.roleName || !formData.password) {
      setError("Please fill in all required fields (email, first name, role name, password)");
      return;
    }

    try {
      setCreateLoading(true);
      setError("");

      const response = await apiClient.createRoleUnderAdmin({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
        roleName: formData.roleName,
        password: formData.password,
      });

      if (response.success) {
        // Add the new member to the list
        if (response.data) {
          setMembers((prev) => [response.data!, ...prev]);
          // Update stats - recalculate unique roles from all members
          setStats((prev) => {
            const allMembers = [response.data!, ...members];
            const uniqueRoles = new Set(allMembers.map(m => m.roleName)).size;
            return {
              ...prev,
              total: prev.total + 1,
              totalMembers: prev.totalMembers + 1,
              uniqueRoles,
            };
          });
        }

        // Reset form
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          phone: "",
          roleName: "",
          password: "",
        });
        setShowCreateForm(false);
      } else {
        setError(response.message || "Failed to create member");
      }
    } catch (err) {
      console.error("Error creating member:", err);
      setError(handleApiError(err));
    } finally {
      setCreateLoading(false);
    }
  };


  // Filter members based on search term
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.roleName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
  };

  // Handle member actions
  const handleMemberAction = async (
    memberId: string,
    action: "view" | "edit" | "delete",
  ) => {
    switch (action) {
      case "view":
        const member = members.find((m) => m.id === memberId);
        if (member) {
          setSelectedMember(member);
          setViewMode("detail");
        }
        break;
      case "edit":
        // Handle edit logic here
        break;
      case "delete":
        // Members deletion might not be allowed from this view
        // Handle delete logic here if needed
        break;
    }
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedMember(null);
    setViewMode("list");
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
                  Member Details
                </h1>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats Display */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className=" text-lg text-neutral-700 mr-4">
                  Team Members
                </h1>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Total Members: {stats.totalMembers}</span>
                  <span>Unique Roles: {stats.uniqueRoles}</span>
                </div>
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
                  Add Member
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
              Add a new member
            </CardTitle>
            <div className="w-full h-px bg-gray-200 mt-4"></div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMember} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
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
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
                    />
                  </div>

                  {/* Role Name */}
                  <div className="space-y-2">
                    <Label htmlFor="roleName" className="text-sm font-medium text-gray-700">
                      Role Name *
                    </Label>
                    <Input
                      id="roleName"
                      placeholder="Enter role name (e.g., Content Manager)"
                      value={formData.roleName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          roleName: e.target.value,
                        }))
                      }
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
                      Password *
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
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)'
                      }}
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
                    "Add Member"
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
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          {searchTerm
                            ? `No members found matching your search.`
                            : "No team members found."}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-brand-gradient text-white">
                                <TableHead className="text-white min-w-[200px] px-4">
                                  Name
                                </TableHead>
                                <TableHead className="text-white min-w-[200px] px-4">
                                  Email
                                </TableHead>
                                <TableHead className="text-white min-w-[150px] px-4">
                                  Role
                                </TableHead>
                                <TableHead className="text-white min-w-[150px] px-4">
                                  Phone
                                </TableHead>
                                <TableHead className="text-white text-right min-w-[100px] px-4">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedMembers.map((member) => (
                                <TableRow
                                  key={member.id}
                                  className="hover:bg-gray-50"
                                >
                                  {/* Name Column */}
                                  <TableCell className="px-4">
                                    <h3 className="text-base text-gray-900">
                                      {member.firstName} {member.lastName}
                                    </h3>
                                  </TableCell>

                                  {/* Email Column */}
                                  <TableCell className="px-4">
                                    <div className="text-sm text-gray-600">
                                      {member.email}
                                    </div>
                                  </TableCell>

                                  {/* Role Column */}
                                  <TableCell className="px-4">
                                    <Badge variant="outline" className="text-xs">
                                      {member.roleName}
                                    </Badge>
                                  </TableCell>

                                  {/* Phone Column */}
                                  <TableCell className="px-4">
                                    <div className="text-sm text-gray-600">
                                      {member.phone}
                                    </div>
                                  </TableCell>

                                  {/* Actions Column */}
                                  <TableCell className="text-right px-4">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleMemberAction(member.id, "view")
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
                    {filteredMembers.length > 0 && (
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
                            <span className="text-sm text-muted-foreground">of {filteredMembers.length} members</span>
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
            /* Member Detail View */
            selectedMember && (
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

                        {/* Member Info */}
                        <div className="flex-1">
                          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                            {selectedMember.firstName} {selectedMember.lastName}
                          </h1>
                          <p className="text-xl text-gray-600 mb-4">
                            {selectedMember.roleName}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-sm"
                      >
                        {selectedMember.roleName}
                      </Badge>
                    </div>

                    {/* Accordion sections */}
                    <div className="space-y-3">
                      <AccordionSection title="Member Information" defaultOpen>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <UserCheck className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Full Name</p>
                                <p className="font-medium">{selectedMember.firstName} {selectedMember.lastName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{selectedMember.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-medium">{selectedMember.phone}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Role</span><Badge variant="outline">{selectedMember.roleName}</Badge></div>
                            <div className="flex justify-between"><span className="text-gray-600">Member ID</span><span className="font-mono text-xs">{selectedMember.id}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Admin ID</span><span className="font-mono text-xs">{selectedMember.adminId}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Created</span><span>{formatDate(selectedMember.createdAt)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Updated</span><span>{formatDate(selectedMember.updatedAt)}</span></div>
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
            )
          )}
        </>
      )}
    </div>
  );
}
