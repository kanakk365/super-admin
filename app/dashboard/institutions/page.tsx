"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Upload,
  X,
  Building2,
  ArrowLeft,
  Phone,
  Mail,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import { handleApiError, apiClient } from "@/lib/api";
import type {
  InstitutionStudentsResponse,
  InstitutionSummaryResponse,
  InstitutionStudentsBreakdownResponse,
  InstitutionStatsResponse,
  InstitutionFeatureAssignment,
} from "@/lib/types";

interface Institution {
  id: string;
  name: string;
  type: string;
  pocName: string | null;
  affiliatedBoard: string;
  email: string;
  password: string | null;
  phone: string;
  website: string;
  yearOfEstablishment: string;
  totalStudentStrength: number;
  proofOfInstitutionUrl: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  address: string;
  approvalStatus: "APPROVED" | "PENDING" | "REJECTED";
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  addedById: string;
}

interface InstitutionsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    data: Institution[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface InstitutionStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface InstitutionFormData {
  name: string;
  type: string;
  affiliatedBoard: string;
  email: string;
  phone: string;
  website: string;
  yearOfEstablishment: string;
  totalStudentStrength: string;
  address: string;
  proofOfInstitution: File | null;
  logo: File | null;
  primaryColor: string;
  secondaryColor: string;
  password: string;
}

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

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail" | "edit">("list");

  // Institution detail data
  const [institutionStudents, setInstitutionStudents] =
    useState<InstitutionStudentsResponse | null>(null);
  const [institutionSummary, setInstitutionSummary] =
    useState<InstitutionSummaryResponse | null>(null);
  const [institutionStudentsBreakdown, setInstitutionStudentsBreakdown] =
    useState<InstitutionStudentsBreakdownResponse | null>(null);
  const [institutionStats, setInstitutionStats] =
    useState<InstitutionStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [institutionFeatures, setInstitutionFeatures] = useState<
    InstitutionFeatureAssignment[] | null
  >(null);

  // Feature editing state
  const [featureEdits, setFeatureEdits] = useState<Record<string, boolean>>({});
  const [featureUpdateLoading, setFeatureUpdateLoading] = useState(false);
  const [featureUpdateError, setFeatureUpdateError] = useState<string | null>(
    null
  );
  const [featureUpdateSuccess, setFeatureUpdateSuccess] = useState<
    string | null
  >(null);

  // Students pagination state
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPageSize] = useState(20);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Grade filter state
  const [selectedGrade, setSelectedGrade] = useState<string>("ALL");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "APPROVED" | "PENDING" | "REJECTED"
  >("ALL");
  const [stats, setStats] = useState<InstitutionStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  // Modal state for approval/rejection
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [institutionToApprove, setInstitutionToApprove] =
    useState<Institution | null>(null);

  // Modal state for suspension
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [institutionToSuspend, setInstitutionToSuspend] =
    useState<Institution | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<InstitutionFormData>({
    name: "",
    type: "",
    affiliatedBoard: "",
    email: "",
    phone: "",
    website: "",
    yearOfEstablishment: "",
    totalStudentStrength: "",
    address: "",
    proofOfInstitution: null,
    logo: null,
    primaryColor: "#ffffff",
    secondaryColor: "#ffffff",
    password: "",
  });

  // Fetch institutions from API
  const fetchInstitutions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/super-admin/institution`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: InstitutionsResponse = await response.json();

      if (data.success) {
        setInstitutions(data.data.data);

        // Calculate stats
        const total = data.data.data.length;
        const approved = data.data.data.filter(
          (inst) => inst.approvalStatus === "APPROVED"
        ).length;
        const pending = data.data.data.filter(
          (inst) => inst.approvalStatus === "PENDING"
        ).length;
        const rejected = data.data.data.filter(
          (inst) => inst.approvalStatus === "REJECTED"
        ).length;

        setStats({ total, approved, pending, rejected });
      } else {
        setError(data.message || "Failed to fetch institutions");
      }
    } catch (err) {
      console.error("Error fetching institutions:", err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new institution
  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setCreateLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("affiliatedBoard", formData.affiliatedBoard);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("website", formData.website);
      formDataToSend.append(
        "yearOfEstablishment",
        formData.yearOfEstablishment
      );
      formDataToSend.append(
        "totalStudentStrength",
        formData.totalStudentStrength
      );
      formDataToSend.append("address", formData.address);
      formDataToSend.append("primaryColor", formData.primaryColor);
      formDataToSend.append("secondaryColor", formData.secondaryColor);
      formDataToSend.append("password", formData.password);

      if (formData.proofOfInstitution) {
        formDataToSend.append(
          "proofOfInstitution",
          formData.proofOfInstitution
        );
      }

      if (formData.logo) {
        formDataToSend.append("logo", formData.logo);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/super-admin/institution`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFormData({
          name: "",
          type: "",
          affiliatedBoard: "",
          email: "",
          phone: "",
          website: "",
          yearOfEstablishment: "",
          totalStudentStrength: "",
          address: "",
          proofOfInstitution: null,
          logo: null,
          primaryColor: "#ffffff",
          secondaryColor: "#ffffff",
          password: "",
        });
        setShowCreateForm(false);

        // Refresh institutions list
        await fetchInstitutions();
      } else {
        setError(data.message || "Failed to create institution");
      }
    } catch (err) {
      console.error("Error creating institution:", err);
      setError(handleApiError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (
    field: "proofOfInstitution" | "logo",
    file: File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  // Filter institutions based on search term and status
  const filteredInstitutions = institutions.filter((institution) => {
    const matchesSearch =
      institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.affiliatedBoard
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || institution.approvalStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredInstitutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInstitutions = filteredInstitutions.slice(
    startIndex,
    endIndex
  );

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

  // Handle institution actions
  const handleInstitutionAction = async (
    institutionId: string,
    action: "view" | "edit"
  ) => {
    switch (action) {
      case "view":
        try {
          setLoading(true);
          setError("");

          // Fetch institution details
          const institutionResponse = await apiClient.getInstitutionById(
            institutionId
          );

          if (institutionResponse.success && institutionResponse.data) {
            setSelectedInstitution(institutionResponse.data);

            // Fetch additional institution data in parallel
            const [
              summaryResponse,
              breakdownResponse,
              statsResponse,
              featuresResponse,
            ] = await Promise.allSettled([
              apiClient.getInstitutionSummary(institutionId),
              apiClient.getInstitutionStudentsBreakdown(institutionId),
              apiClient.getInstitutionStats(institutionId),
              apiClient.getInstitutionFeatures(institutionId),
            ]);

            // Handle summary data
            if (
              summaryResponse.status === "fulfilled" &&
              summaryResponse.value.success &&
              summaryResponse.value.data
            ) {
              setInstitutionSummary(summaryResponse.value.data!);
            }

            // Handle breakdown data
            if (
              breakdownResponse.status === "fulfilled" &&
              breakdownResponse.value.success &&
              breakdownResponse.value.data
            ) {
              setInstitutionStudentsBreakdown(breakdownResponse.value.data!);
            }

            // Handle stats data
            if (
              statsResponse.status === "fulfilled" &&
              statsResponse.value.success &&
              statsResponse.value.data
            ) {
              setInstitutionStats(statsResponse.value.data!);
            }

            // Handle features data
            if (
              featuresResponse.status === "fulfilled" &&
              featuresResponse.value.success &&
              featuresResponse.value.data
            ) {
              setInstitutionFeatures(featuresResponse.value.data!);
            } else {
              setInstitutionFeatures([]);
            }

            // Fetch initial students data
            await fetchInstitutionStudents(institutionId, 1);

            setViewMode("detail");
          } else {
            setError(
              institutionResponse.message ||
                "Failed to fetch institution details"
            );
          }
        } catch (err) {
          console.error("Error fetching institution details:", err);
          setError(handleApiError(err));
        } finally {
          setLoading(false);
        }
        break;

      case "edit":
        try {
          setLoading(true);
          setError("");

          // Fetch institution details for editing
          const institutionResponse = await apiClient.getInstitutionById(
            institutionId
          );

          if (institutionResponse.success && institutionResponse.data) {
            setSelectedInstitution(institutionResponse.data);

            // Pre-populate form with institution data
            setFormData({
              name: institutionResponse.data.name,
              type: institutionResponse.data.type,
              affiliatedBoard: institutionResponse.data.affiliatedBoard,
              email: institutionResponse.data.email,
              phone: institutionResponse.data.phone,
              website: institutionResponse.data.website || "",
              yearOfEstablishment: institutionResponse.data.yearOfEstablishment,
              totalStudentStrength:
                institutionResponse.data.totalStudentStrength.toString(),
              address: institutionResponse.data.address,
              proofOfInstitution: null,
              logo: null,
              primaryColor: institutionResponse.data.primaryColor || "#ffffff",
              secondaryColor:
                institutionResponse.data.secondaryColor || "#ffffff",
              password: "", // Don't pre-populate password for security
            });

            setViewMode("edit");
          } else {
            setError(
              institutionResponse.message ||
                "Failed to fetch institution details"
            );
          }
        } catch (err) {
          console.error("Error fetching institution details for edit:", err);
          setError(handleApiError(err));
        } finally {
          setLoading(false);
        }
        break;
    }
  };

  // Fetch students with pagination
  const fetchInstitutionStudents = useCallback(
    async (institutionId: string, page: number = 1) => {
      try {
        setStudentsLoading(true);
        const response = await apiClient.getInstitutionStudents(
          institutionId,
          page,
          studentsPageSize
        );

        if (response.success && response.data) {
          setInstitutionStudents(response.data);
          setStudentsPage(page);
        }
      } catch (err) {
        console.error("Error fetching institution students:", err);
      } finally {
        setStudentsLoading(false);
      }
    },
    [studentsPageSize]
  );

  // When grade filter changes, reset page client-side only
  useEffect(() => {
    setStudentsPage(1);
  }, [selectedGrade]);

  // Handle students page change
  const handleStudentsPageChange = (newPage: number) => {
    if (selectedInstitution) {
      fetchInstitutionStudents(selectedInstitution.id, newPage);
    }
  };

  // Handle institution edit
  const handleEditInstitution = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInstitution) return;

    if (!formData.name || !formData.email || !formData.phone) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setCreateLoading(true);
      setError("");

      const updateData = {
        name: formData.name,
        type: formData.type,
        affiliatedBoard: formData.affiliatedBoard,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        yearOfEstablishment: formData.yearOfEstablishment,
        totalStudentStrength: parseInt(formData.totalStudentStrength),
        address: formData.address,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
      };

      const response = await apiClient.updateInstitution(
        selectedInstitution.id,
        updateData
      );

      if (response.success) {
        // Refresh institutions list
        await fetchInstitutions();

        // Reset form and go back to list
        setFormData({
          name: "",
          type: "",
          affiliatedBoard: "",
          email: "",
          phone: "",
          website: "",
          yearOfEstablishment: "",
          totalStudentStrength: "",
          address: "",
          proofOfInstitution: null,
          logo: null,
          primaryColor: "#ffffff",
          secondaryColor: "#ffffff",
          password: "",
        });
        setSelectedInstitution(null);
        setViewMode("list");
      } else {
        setError(response.message || "Failed to update institution");
      }
    } catch (err) {
      console.error("Error updating institution:", err);
      setError(handleApiError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle institution approval/rejection
  const handleInstitutionApproval = async (action: "APPROVE" | "REJECT") => {
    if (!institutionToApprove) return;

    try {
      setCreateLoading(true);
      setError("");

      const baseURL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${baseURL}/super-admin/institutions/approval`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: institutionToApprove.id,
            action: action,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh institutions list
        await fetchInstitutions();

        // Close modal and reset state
        setApprovalModalOpen(false);
        setInstitutionToApprove(null);
      } else {
        setError(
          data.message || `Failed to ${action.toLowerCase()} institution`
        );
      }
    } catch (err) {
      console.error(`Error ${action.toLowerCase()}ing institution:`, err);
      setError(handleApiError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle institution suspension
  const handleInstitutionSuspension = async (suspend: boolean) => {
    if (!institutionToSuspend) return;

    try {
      setCreateLoading(true);
      setError("");

      const baseURL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${baseURL}/super-admin/institutions/suspend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: institutionToSuspend.id,
            suspend: suspend,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh institutions list
        await fetchInstitutions();

        // Close modal and reset state
        setSuspendModalOpen(false);
        setInstitutionToSuspend(null);
      } else {
        setError(
          data.message ||
            `Failed to ${suspend ? "suspend" : "unsuspend"} institution`
        );
      }
    } catch (err) {
      console.error(
        `Error ${suspend ? "suspending" : "unsuspending"} institution:`,
        err
      );
      setError(handleApiError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle feature toggle
  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    setFeatureUpdateError(null);
    setFeatureUpdateSuccess(null);

    setFeatureEdits((prev) => ({
      ...prev,
      [featureId]: enabled,
    }));
  };

  // Handle feature updates save
  const handleFeatureUpdate = async () => {
    if (!selectedInstitution || !institutionFeatures) return;

    try {
      setFeatureUpdateLoading(true);
      setFeatureUpdateError(null);
      setFeatureUpdateSuccess(null);

      // Get current states (with edits applied)
      const updatedFeatures = institutionFeatures.map((assignment) => ({
        key: assignment.feature.key,
        enabled: featureEdits[assignment.id] ?? assignment.enabled,
      }));

      const response = await apiClient.assignInstitutionFeatures({
        institutionId: selectedInstitution.id,
        features: updatedFeatures,
      });

      if (!response.success) {
        throw new Error("Failed to update features");
      }

      setFeatureUpdateSuccess(
        response.data?.message || "Features updated successfully"
      );

      // Refresh institution features
      const refreshed = await apiClient.getInstitutionFeatures(
        selectedInstitution.id
      );
      if (refreshed.success && refreshed.data) {
        setInstitutionFeatures(refreshed.data);
      }

      // Clear edits
      setFeatureEdits({});
    } catch (err) {
      setFeatureUpdateError(
        err instanceof Error ? err.message : "An error occurred"
      );
    } finally {
      setFeatureUpdateLoading(false);
    }
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedInstitution(null);
    setInstitutionStudents(null);
    setInstitutionSummary(null);
    setInstitutionStudentsBreakdown(null);
    setInstitutionStats(null);
    setStudentsPage(1);
    setStudentsLoading(false);
    setStatsLoading(false);
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

  // Load institutions on component mount
  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

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
          ) : viewMode === "edit" ? (
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBackToList}>
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl text-neutral-700 font-semibold tracking-tight">
                  Edit Institution
                </h1>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className=" text-lg text-neutral-700 mr-4">
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
                  variant={statusFilter === "REJECTED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("REJECTED")}
                  className={
                    statusFilter === "REJECTED"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  Rejected ({stats.rejected})
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
                  className="pl-10 w-full h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400"
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
                  New Institution
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Edit Institution Form */}
      {viewMode === "edit" && (
        <Card className="max-w-7xl mx-auto">
          <CardHeader className="text-left pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Edit Institution Details
            </CardTitle>
            <div className="w-full h-px bg-gray-200 mt-4"></div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditInstitution} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Institution name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Institution name
                    </Label>
                    <Input
                      id="edit-name"
                      placeholder="Name of the Institute"
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
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Affiliated Board/University */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-affiliatedBoard"
                      className="text-sm font-medium text-gray-700"
                    >
                      Affiliated Board/University
                    </Label>
                    <Input
                      id="edit-affiliatedBoard"
                      placeholder="Enter affiliated board"
                      value={formData.affiliatedBoard}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          affiliatedBoard: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Official Phone Number / Landline */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-phone"
                      className="text-sm font-medium text-gray-700"
                    >
                      Official Phone Number / Landline
                    </Label>
                    <Input
                      id="edit-phone"
                      placeholder="Type contact no."
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Institution Address */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-address"
                      className="text-sm font-medium text-gray-700"
                    >
                      Institution Address
                    </Label>
                    <Textarea
                      id="edit-address"
                      placeholder="Type address info"
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400 resize-y overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                        minHeight: "44px",
                      }}
                      value={formData.address}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }));
                        // Auto-resize functionality
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                    />
                  </div>

                  {/* Official Email Address */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Official Email Address
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="Enter Email"
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
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Type of Institution */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-type"
                      className="text-sm font-medium text-gray-700"
                    >
                      Type of Institution
                    </Label>
                    <Input
                      id="edit-type"
                      placeholder="e.g., University, College, School"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Year of Establishment (optional) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-yearOfEstablishment"
                      className="text-sm font-medium text-gray-700"
                    >
                      Year of Establishment (optional)
                    </Label>
                    <Input
                      id="edit-yearOfEstablishment"
                      placeholder="Enter year of establishment"
                      value={formData.yearOfEstablishment}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          yearOfEstablishment: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Website URL (optional) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-website"
                      className="text-sm font-medium text-gray-700"
                    >
                      Website URL (optional)
                    </Label>
                    <Input
                      id="edit-website"
                      placeholder="Enter website url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Total Student Strength (optional) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-totalStudentStrength"
                      className="text-sm font-medium text-gray-700"
                    >
                      Total Student Strength (optional)
                    </Label>
                    <Input
                      id="edit-totalStudentStrength"
                      placeholder="Enter student strength"
                      value={formData.totalStudentStrength}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          totalStudentStrength: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Fields for Backend Compatibility */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-primaryColor"
                    className="text-sm font-medium text-gray-700"
                  >
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="w-16 h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="flex-1 h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-secondaryColor"
                    className="text-sm font-medium text-gray-700"
                  >
                    Secondary Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          secondaryColor: e.target.value,
                        }))
                      }
                      className="w-16 h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          secondaryColor: e.target.value,
                        }))
                      }
                      className="flex-1 h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400"
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
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToList}
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
                      Updating...
                    </>
                  ) : (
                    "Update institution"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Create Institution Form */}
      {showCreateForm && (
        <Card className="max-w-7xl mx-auto">
          <CardHeader className="text-left pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Register a new school/institution
            </CardTitle>
            <div className="w-full h-px bg-gray-200 mt-4"></div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateInstitution} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Institution name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Institution name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Name of the Institute"
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
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Affiliated Board/University */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="affiliatedBoard"
                      className="text-sm font-medium text-gray-700"
                    >
                      Affiliated Board/University
                    </Label>
                    <Input
                      id="affiliatedBoard"
                      placeholder="Enter affiliated board"
                      value={formData.affiliatedBoard}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          affiliatedBoard: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Official Phone Number / Landline */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium text-gray-700"
                    >
                      Official Phone Number / Landline
                    </Label>
                    <Input
                      id="phone"
                      placeholder="Type contact no."
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>
                  {/* Institution Address */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="text-sm font-medium text-gray-700"
                    >
                      Institution Address
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Type address info"
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400 resize-y overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                        minHeight: "44px",
                      }}
                      value={formData.address}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }));
                        // Auto-resize functionality
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Official Email Address
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
                      required
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>
                  {/* Upload Proof of Institution */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="proofOfInstitution"
                      className="text-sm font-medium text-gray-700"
                    >
                      Upload Proof of Institution
                    </Label>
                    <div className="relative">
                      <Input
                        id="proofOfInstitution"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleFileChange(
                            "proofOfInstitution",
                            e.target.files?.[0] || null
                          )
                        }
                        className="h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400 pr-10"
                        placeholder="e.g., affiliation certificate, recognition letter"
                      />
                      <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {formData.proofOfInstitution && (
                      <p className="text-xs text-gray-500">
                        Selected: {formData.proofOfInstitution.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Type of Institution */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="type"
                      className="text-sm font-medium text-gray-700"
                    >
                      Type of Institution
                    </Label>
                    <Input
                      id="type"
                      placeholder="e.g., University, College, School"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Year of Establishment (optional) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="yearOfEstablishment"
                      className="text-sm font-medium text-gray-700"
                    >
                      Year of Establishment (optional)
                    </Label>
                    <Input
                      id="yearOfEstablishment"
                      placeholder="Enter year of establishment"
                      value={formData.yearOfEstablishment}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          yearOfEstablishment: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>
                  {/* Website URL (optional) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="website"
                      className="text-sm font-medium text-gray-700"
                    >
                      Website URL (optional)
                    </Label>
                    <Input
                      id="website"
                      placeholder="Enter website url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Total Student Strength (optional) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="totalStudentStrength"
                      className="text-sm font-medium text-gray-700"
                    >
                      Total Student Strength (optional)
                    </Label>
                    <Input
                      id="totalStudentStrength"
                      placeholder="Enter student strength"
                      value={formData.totalStudentStrength}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          totalStudentStrength: e.target.value,
                        }))
                      }
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

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
                      className="h-11 border-0 focus:border-orange-400 focus:ring-orange-400"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,179,31,0.15) 6.54%, rgba(255,73,73,0.15) 90.65%)",
                      }}
                    />
                  </div>

                  {/* Institution Logo */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="logo"
                      className="text-sm font-medium text-gray-700"
                    >
                      Institution Logo
                    </Label>
                    <div className="relative">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange("logo", e.target.files?.[0] || null)
                        }
                        className="h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400 pr-10"
                      />
                      <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {formData.logo && (
                      <p className="text-xs text-gray-500">
                        Selected: {formData.logo.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Fields for Backend Compatibility */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="primaryColor"
                    className="text-sm font-medium text-gray-700"
                  >
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="w-16 h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="flex-1 h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="secondaryColor"
                    className="text-sm font-medium text-gray-700"
                  >
                    Secondary Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          secondaryColor: e.target.value,
                        }))
                      }
                      className="w-16 h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          secondaryColor: e.target.value,
                        }))
                      }
                      className="flex-1 h-11 bg-brand-gradient-faint border-0 focus:border-orange-400 focus:ring-orange-400"
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
                    "Create institution"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Institutions List or Detail View */}
      {!showCreateForm && viewMode !== "edit" && (
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
                        onClick={fetchInstitutions}
                        variant="outline"
                        size="sm"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}

                {/* Institutions List */}
                {!loading && !error && (
                  <>
                    {filteredInstitutions.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter !== "ALL"
                            ? `No institutions found matching ${
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
                            : "No institutions found."}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-brand-gradient text-white">
                                <TableHead className="text-white min-w-[80px] px-4">
                                  Logo
                                </TableHead>
                                <TableHead className="text-white min-w-[200px] px-4">
                                  Institution & Type
                                </TableHead>
                                <TableHead className="text-white min-w-[180px] px-4">
                                  Contact
                                </TableHead>
                                <TableHead className="text-white min-w-[100px] px-4">
                                  Status
                                </TableHead>
                                <TableHead className="text-white min-w-[100px] px-4">
                                  Established
                                </TableHead>
                                <TableHead className="text-white text-right min-w-[100px] px-4">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedInstitutions.map((institution) => (
                                <TableRow
                                  key={institution.id}
                                  className="hover:bg-gray-50"
                                >
                                  {/* Logo Column */}
                                  <TableCell className="px-4">
                                    {institution.logoUrl ? (
                                      <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden relative">
                                        <Image
                                          src={institution.logoUrl}
                                          alt={institution.name}
                                          fill
                                          className="object-cover"
                                          onError={(e) => {
                                            const target =
                                              e.target as HTMLImageElement;
                                            target.style.display = "none";
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-gray-400" />
                                      </div>
                                    )}
                                  </TableCell>

                                  {/* Institution & Type Column */}
                                  <TableCell className="px-4">
                                    <div>
                                      <h3 className=" text-base text-gray-900 mb-1">
                                        {institution.name}
                                      </h3>
                                      {/* <p className="text-sm text-gray-600">
                                        {institution.type} •{" "}
                                        {institution.affiliatedBoard}
                                      </p> */}
                                    </div>
                                  </TableCell>

                                  {/* Contact Column */}
                                  <TableCell className="px-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Mail className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate min-w-0">
                                          {institution.email}
                                        </span>
                                      </div>
                                      {/* <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Phone className="h-4 w-4 flex-shrink-0" />
                                        <span>{institution.phone}</span>
                                      </div> */}
                                    </div>
                                  </TableCell>

                                  {/* Status Column */}
                                  <TableCell className="px-4">
                                    <div className="flex flex-col gap-1">
                                      <Badge
                                        className={`cursor-pointer hover:opacity-80 transition-opacity ${
                                          institution.approvalStatus ===
                                          "APPROVED"
                                            ? "bg-transparent text-orange-600 border border-orange-400"
                                            : institution.approvalStatus ===
                                              "PENDING"
                                            ? "bg-yellow-100 text-yellow-800 border border-yellow-400"
                                            : "bg-red-100 text-red-800 border border-red-400"
                                        }`}
                                        onClick={() => {
                                          setInstitutionToApprove(institution);
                                          setApprovalModalOpen(true);
                                        }}
                                      >
                                        {institution.approvalStatus}
                                      </Badge>
                                      {institution.isSuspended && (
                                        <div className="mt-1">
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <span className="inline-block h-1 w-1 rounded-full bg-red-500 mr-1"></span>
                                            Suspended
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Established Column */}
                                  <TableCell className="px-4">
                                    <div className="text-sm text-gray-600">
                                      {institution.yearOfEstablishment}
                                    </div>
                                  </TableCell>

                                  {/* Actions Column */}
                                  <TableCell className="text-right px-4">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleInstitutionAction(
                                          institution.id,
                                          "view"
                                        )
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
                    {filteredInstitutions.length > 0 && (
                      <div className="flex flex-col gap-4 p-4 bg-gray-50 border-t">
                        {/* Pagination Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Items per page selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Showing:
                            </span>
                            <Select
                              value={itemsPerPage.toString()}
                              onValueChange={handleItemsPerPageChange}
                            >
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
                                onClick={() =>
                                  handlePageChange(currentPage - 1)
                                }
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>

                              <div className="flex items-center gap-1">
                                {Array.from(
                                  { length: Math.min(5, totalPages) },
                                  (_, i) => {
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
                                          currentPage === pageNumber
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                          handlePageChange(pageNumber)
                                        }
                                        className={
                                          currentPage === pageNumber
                                            ? "bg-brand-gradient text-white"
                                            : ""
                                        }
                                      >
                                        {pageNumber}
                                      </Button>
                                    );
                                  }
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePageChange(currentPage + 1)
                                }
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
            /* Institution Detail View */
            <Card className="py-0">
              <CardContent className="p-8">
                {selectedInstitution && (
                  <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-6">
                        {/* Logo */}
                        {selectedInstitution.logoUrl ? (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                            <Image
                              src={selectedInstitution.logoUrl}
                              alt={selectedInstitution.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-[4.5rem] bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        {/* Institution Info */}
                        <div className="flex-1">
                          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                            {selectedInstitution.name}
                          </h1>
                          <p className="text-xl text-gray-600 mb-4">
                            {selectedInstitution.type} •{" "}
                            {selectedInstitution.affiliatedBoard}
                          </p>
                          {/* <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Established{" "}
                                {selectedInstitution.yearOfEstablishment}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>
                                {selectedInstitution.totalStudentStrength.toLocaleString()}{" "}
                                Students
                              </span>
                            </div>
                          </div> */}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleInstitutionAction(
                              selectedInstitution.id,
                              "edit"
                            )
                          }
                          className="bg-brand-gradient text-white hover:opacity-90 transition-opacity"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setInstitutionToSuspend(selectedInstitution);
                            setSuspendModalOpen(true);
                          }}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Suspend
                        </Button>
                      </div>
                    </div>

                    {/* Accordion sections */}
                    <div className="space-y-3">
                      <AccordionSection title="Overview" defaultOpen>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Institution
                              </div>
                              <div className="font-medium text-gray-900">
                                {selectedInstitution.name}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Type
                              </div>
                              <div className="font-medium text-gray-900">
                                {selectedInstitution.type}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Status
                              </div>
                              <div className="font-medium text-gray-900 flex items-center">
                                <span
                                  className={`inline-block h-2 w-2 rounded-full mr-2 ${
                                    selectedInstitution.approvalStatus ===
                                    "APPROVED"
                                      ? "bg-green-500"
                                      : selectedInstitution.approvalStatus ===
                                        "PENDING"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                ></span>
                                {selectedInstitution.approvalStatus}
                              </div>
                              <div className="mt-2">
                                {selectedInstitution.isSuspended && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 mr-1"></span>
                                    Suspended
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Email
                              </div>
                              <div className="font-medium text-gray-900 break-all">
                                {selectedInstitution.email}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Affiliated Board
                              </div>
                              <div className="font-medium text-gray-900">
                                {selectedInstitution.affiliatedBoard}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Established
                              </div>
                              <div className="font-medium text-gray-900">
                                {selectedInstitution.yearOfEstablishment}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Phone
                              </div>
                              <div className="font-medium text-gray-900">
                                {selectedInstitution.phone}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Students
                              </div>
                              <div className="font-medium text-gray-900">
                                {selectedInstitution.totalStudentStrength.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Website
                              </div>
                              <div className="font-medium text-gray-900">
                                {selectedInstitution.website ? (
                                  <a
                                    href={selectedInstitution.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    {selectedInstitution.website}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </div>
                            </div>
                            <div className="md:col-span-3">
                              <div className="text-sm text-gray-600 mb-1">
                                Address
                              </div>
                              <div className="font-medium text-gray-900">
                                {selectedInstitution.address || "-"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection title="Assigned Features">
                        {/* Update status messages */}
                        {featureUpdateError && (
                          <div
                            className="mb-4 text-center text-sm text-red-600 bg-red-50 p-2 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {featureUpdateError}
                          </div>
                        )}
                        {featureUpdateSuccess && (
                          <div
                            className="mb-4 text-center text-sm text-green-700 bg-green-50 p-2 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {featureUpdateSuccess}
                          </div>
                        )}

                        {institutionFeatures ? (
                          institutionFeatures.length > 0 ? (
                            <div className="space-y-4">
                              <div className="rounded-lg border overflow-hidden">
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-gray-50">
                                        <TableHead className="text-xs">
                                          Feature
                                        </TableHead>
                                        <TableHead className="text-xs">
                                          Description
                                        </TableHead>
                                        <TableHead className="text-xs text-right">
                                          Enabled
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {institutionFeatures.map((assignment) => (
                                        <TableRow key={assignment.id}>
                                          <TableCell className="text-sm">
                                            {assignment.feature.name}
                                          </TableCell>
                                          <TableCell className="text-sm text-gray-600">
                                            {assignment.feature.description}
                                          </TableCell>
                                          <TableCell className="text-sm text-right">
                                            <div
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <Switch
                                                checked={
                                                  featureEdits[assignment.id] ??
                                                  assignment.enabled
                                                }
                                                onCheckedChange={(checked) =>
                                                  handleFeatureToggle(
                                                    assignment.id,
                                                    !!checked
                                                  )
                                                }
                                                disabled={featureUpdateLoading}
                                                aria-label={`${assignment.feature.name} status`}
                                              />
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              {/* Save button */}
                              <div
                                className="flex items-center justify-end gap-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  onClick={() => setFeatureEdits({})}
                                  disabled={
                                    featureUpdateLoading ||
                                    Object.keys(featureEdits).length === 0
                                  }
                                >
                                  Reset Changes
                                </Button>
                                <Button
                                  variant="default"
                                  onClick={handleFeatureUpdate}
                                  disabled={
                                    featureUpdateLoading ||
                                    Object.keys(featureEdits).length === 0
                                  }
                                >
                                  {featureUpdateLoading
                                    ? "Updating..."
                                    : "Update Features"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              No features assigned.
                            </div>
                          )
                        ) : (
                          <div className="flex items-center justify-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </AccordionSection>

                      <AccordionSection title="Admin Users">
                        <p className="text-sm text-gray-600">Coming soon</p>
                      </AccordionSection>

                      <AccordionSection title="Student details" defaultOpen>
                        {institutionStudentsBreakdown ? (
                          <div className="space-y-6">
                            {/* Students Breakdown */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-gray-900">
                                Students Breakdown
                              </h4>

                              {/* By Class */}
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-2">
                                  By Class
                                </h5>
                                <div className="grid gap-2">
                                  {institutionStudentsBreakdown.byClass.map(
                                    (classItem) => (
                                      <div
                                        key={classItem.standardId}
                                        className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                                      >
                                        <span className="text-sm text-gray-900">
                                          {classItem.standardName}
                                        </span>
                                        <Badge variant="secondary">
                                          {classItem.count} students
                                        </Badge>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>

                              {/* By Section */}
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-2">
                                  By Section
                                </h5>
                                <div className="grid gap-2">
                                  {institutionStudentsBreakdown.bySection.map(
                                    (sectionItem) => (
                                      <div
                                        key={sectionItem.sectionId}
                                        className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                                      >
                                        <span className="text-sm text-gray-900">
                                          {sectionItem.sectionName}
                                        </span>
                                        <Badge variant="secondary">
                                          {sectionItem.count} students
                                        </Badge>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Students List */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900">
                                  Students{" "}
                                  {institutionStudents
                                    ? `(${(selectedGrade === "ALL" ? institutionStudents.data : institutionStudents.data.filter((s) => s.grade === selectedGrade)).length})`
                                    : ""}
                                </h4>
                                {studentsLoading && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    Loading...
                                  </div>
                                )}
                              </div>

                              {/* Grade Filter */}
                              <div className="flex items-center gap-2">
                                <Label htmlFor="grade-filter" className="text-sm font-medium">
                                  Filter by Grade:
                                </Label>
                                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                                  <SelectTrigger className="w-48 h-11">
                                    <SelectValue placeholder="Select grade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ALL">All Grades</SelectItem>
                                    {institutionStudents && Array.from(new Set(institutionStudents.data.map(student => student.grade).filter((grade): grade is string => Boolean(grade)))).map(grade => (
                                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {selectedGrade !== "ALL" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedGrade("ALL")}
                                    className="h-11"
                                  >
                                    <X className="h-4 w-4" />
                                    Clear
                                  </Button>
                                )}
                              </div>

                              {institutionStudents ? (
                                <>
                                  <div className="border rounded-lg overflow-hidden">
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
                                            Phone
                                          </TableHead>
                                          <TableHead className="text-white min-w-[100px] px-4">
                                            Grade
                                          </TableHead>
                                          <TableHead className="text-white min-w-[120px] px-4">
                                            Joined
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {(selectedGrade === "ALL"
                                          ? institutionStudents.data
                                          : institutionStudents.data.filter((s) => s.grade === selectedGrade)
                                        ).map(
                                          (student) => (
                                            <TableRow
                                              key={student.id}
                                              className="hover:bg-gray-50"
                                            >
                                              <TableCell className="px-4">
                                                <div>
                                                  <h3 className="text-base text-gray-900 mb-1">
                                                    {student.firstName}{" "}
                                                    {student.lastName}
                                                  </h3>
                                                </div>
                                              </TableCell>
                                              <TableCell className="px-4">
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                  <Mail className="h-4 w-4 flex-shrink-0" />
                                                  <span className="truncate min-w-0">
                                                    {student.email}
                                                  </span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="px-4">
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                  <Phone className="h-4 w-4 flex-shrink-0" />
                                                  <span>{student.phone}</span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="px-4">
                                                <Badge variant="outline" className="text-xs">
                                                  {student.grade}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="px-4 text-sm text-gray-600">
                                                {formatDate(student.createdAt)}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>

                                  {/* Pagination Controls */}
                                  {institutionStudents.meta.totalPages > 1 && (
                                    <div className="flex flex-col gap-4 p-4 bg-gray-50 border-t">
                                      {/* Pagination Info */}
                                      <div className="text-xs text-gray-500 text-center">
                                        Showing{" "}
                                        {(institutionStudents.meta.page - 1) *
                                          institutionStudents.meta.limit +
                                          1}{" "}
                                        to{" "}
                                        {Math.min(
                                          institutionStudents.meta.page *
                                            institutionStudents.meta.limit,
                                          institutionStudents.meta.total
                                        )}{" "}
                                        of {institutionStudents.meta.total}{" "}
                                        students
                                      </div>

                                      {/* Page Navigation */}
                                      <div className="flex items-center justify-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleStudentsPageChange(
                                              studentsPage - 1
                                            )
                                          }
                                          disabled={
                                            studentsPage === 1 ||
                                            studentsLoading
                                          }
                                          className="h-8"
                                        >
                                          <ChevronLeft className="h-4 w-4" />
                                          Previous
                                        </Button>

                                        <div className="flex items-center gap-1">
                                          {/* Show page numbers - limited to 5 pages max */}
                                          {Array.from(
                                            {
                                              length: Math.min(
                                                5,
                                                institutionStudents.meta
                                                  .totalPages
                                              ),
                                            },
                                            (_, i) => {
                                              let pageNumber;
                                              if (
                                                institutionStudents.meta
                                                  .totalPages <= 5
                                              ) {
                                                pageNumber = i + 1;
                                              } else if (studentsPage <= 3) {
                                                pageNumber = i + 1;
                                              } else if (
                                                studentsPage >=
                                                institutionStudents.meta
                                                  .totalPages -
                                                  2
                                              ) {
                                                pageNumber =
                                                  institutionStudents.meta
                                                    .totalPages -
                                                  4 +
                                                  i;
                                              } else {
                                                pageNumber =
                                                  studentsPage - 2 + i;
                                              }

                                              return (
                                                <Button
                                                  key={pageNumber}
                                                  variant={
                                                    studentsPage === pageNumber
                                                      ? "default"
                                                      : "outline"
                                                  }
                                                  size="sm"
                                                  onClick={() =>
                                                    handleStudentsPageChange(
                                                      pageNumber
                                                    )
                                                  }
                                                  disabled={studentsLoading}
                                                  className={`h-8 w-8 p-0 ${
                                                    studentsPage === pageNumber
                                                      ? "bg-brand-gradient text-white"
                                                      : ""
                                                  }`}
                                                >
                                                  {pageNumber}
                                                </Button>
                                              );
                                            }
                                          )}
                                        </div>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleStudentsPageChange(
                                              studentsPage + 1
                                            )
                                          }
                                          disabled={
                                            studentsPage ===
                                              institutionStudents.meta
                                                .totalPages || studentsLoading
                                          }
                                          className="h-8"
                                        >
                                          Next
                                          <ChevronRight className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center justify-center py-8">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </AccordionSection>

                      <AccordionSection title="Analytics summary">
                        {institutionSummary ? (
                          <div className="space-y-6">
                            {/* Institution Metrics */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-4">
                                Institution Statistics
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {institutionSummary.totals.students}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Total Students
                                  </div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                  <div className="text-2xl font-bold text-green-600">
                                    {institutionSummary.totals.quizzes}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Total Quizzes
                                  </div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                  <div className="text-2xl font-bold text-yellow-600">
                                    {institutionSummary.totals.exams}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Total Exams
                                  </div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                  <div className="text-2xl font-bold text-purple-600">
                                    {institutionSummary.totals.projects}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Total Projects
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Completion Rates */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-4">
                                Completion Rates
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">
                                      Quiz Submissions
                                    </span>
                                    <span className="text-sm font-medium">
                                      {
                                        institutionSummary.totals
                                          .quizSubmissions
                                      }
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{
                                        width: `${
                                          institutionSummary.totals.quizzes > 0
                                            ? (institutionSummary.totals
                                                .quizSubmissions /
                                                institutionSummary.totals
                                                  .quizzes) *
                                              100
                                            : 0
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">
                                      Completed Exams
                                    </span>
                                    <span className="text-sm font-medium">
                                      {institutionSummary.totals.completedExams}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{
                                        width: `${
                                          institutionSummary.totals.exams > 0
                                            ? (institutionSummary.totals
                                                .completedExams /
                                                institutionSummary.totals
                                                  .exams) *
                                              100
                                            : 0
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">
                                      Completed Projects
                                    </span>
                                    <span className="text-sm font-medium">
                                      {
                                        institutionSummary.totals
                                          .completedProjects
                                      }
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-orange-500 h-2 rounded-full"
                                      style={{
                                        width: `${
                                          institutionSummary.totals.projects > 0
                                            ? (institutionSummary.totals
                                                .completedProjects /
                                                institutionSummary.totals
                                                  .projects) *
                                              100
                                            : 0
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Institution Timeline */}
                            <div className="grid md:grid-cols-2 gap-4 text-sm border-t pt-4">
                              <div>
                                <div className="text-gray-600 mb-1">
                                  Created
                                </div>
                                <div className="font-medium">
                                  {formatDate(selectedInstitution.createdAt)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600 mb-1">
                                  Last Updated
                                </div>
                                <div className="font-medium">
                                  {formatDate(selectedInstitution.updatedAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </AccordionSection>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-6 border-t">
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

      {/* Approval/Rejection Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {institutionToApprove?.approvalStatus === "PENDING"
                ? "Institution Approval"
                : "Institution Status"}
            </DialogTitle>
            <DialogDescription>
              {institutionToApprove?.approvalStatus === "PENDING"
                ? `Choose an action for ${institutionToApprove?.name}. This action cannot be undone.`
                : `Current status: ${institutionToApprove?.approvalStatus}. Click to change status.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setApprovalModalOpen(false);
                setInstitutionToApprove(null);
              }}
              disabled={createLoading}
            >
              Cancel
            </Button>
            {institutionToApprove?.approvalStatus === "PENDING" ? (
              <>
                <Button
                  onClick={() => handleInstitutionApproval("APPROVE")}
                  variant="default"
                  disabled={createLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createLoading ? "Processing..." : "Approve"}
                </Button>
                <Button
                  onClick={() => handleInstitutionApproval("REJECT")}
                  variant="destructive"
                  disabled={createLoading}
                >
                  {createLoading ? "Processing..." : "Reject"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() =>
                  handleInstitutionApproval(
                    institutionToApprove?.approvalStatus === "APPROVED"
                      ? "REJECT"
                      : "APPROVE"
                  )
                }
                variant={
                  institutionToApprove?.approvalStatus === "APPROVED"
                    ? "destructive"
                    : "default"
                }
                disabled={createLoading}
              >
                {createLoading
                  ? "Processing..."
                  : institutionToApprove?.approvalStatus === "APPROVED"
                  ? "Reject"
                  : "Approve"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspension Modal */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Institution</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {institutionToSuspend?.name}?
              This action will temporarily disable the institution and can be
              reversed later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setSuspendModalOpen(false);
                setInstitutionToSuspend(null);
              }}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleInstitutionSuspension(true)}
              variant="destructive"
              disabled={createLoading}
            >
              {createLoading ? "Processing..." : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
