"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Upload,
  X,
  Building2,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
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

import { handleApiError } from "@/lib/api";

interface Institution {
  id: string;
  name: string;
  type: string;
  affiliatedBoard: string;
  email: string;
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

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "APPROVED" | "PENDING" | "REJECTED"
  >("ALL");
  const [stats, setStats] = useState<InstitutionStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

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
    action: "view"
  ) => {
    switch (action) {
      case "view":
        const institution = institutions.find((i) => i.id === institutionId);
        if (institution) {
          setSelectedInstitution(institution);
          setViewMode("detail");
        }
        break;
    }
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedInstitution(null);
    setViewMode("list");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default";
      case "PENDING":
        return "secondary";
      case "REJECTED":
        return "destructive";
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
                                <TableHead className="text-white min-w-[120px] px-4">
                                  Students
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
                                    <Badge
                                      variant={getStatusColor(
                                        institution.approvalStatus
                                      )}
                                    >
                                      {institution.approvalStatus}
                                    </Badge>
                                  </TableCell>

                                  {/* Students Column */}
                                  <TableCell className="px-4">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Users className="h-4 w-4 flex-shrink-0" />
                                      <span>
                                        {institution.totalStudentStrength.toLocaleString()}
                                      </span>
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
                      <Badge
                        variant={getStatusColor(
                          selectedInstitution.approvalStatus
                        )}
                        className="text-sm"
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
                                <p className="font-medium">
                                  {selectedInstitution.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-medium">
                                  {selectedInstitution.phone}
                                </p>
                              </div>
                            </div>
                            {selectedInstitution.website && (
                              <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Website
                                  </p>
                                  <a
                                    href={selectedInstitution.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    {selectedInstitution.website}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            )}
                            {selectedInstitution.address && (
                              <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Address
                                  </p>
                                  <p className="font-medium">
                                    {selectedInstitution.address}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type</span>
                              <span>{selectedInstitution.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Affiliated Board
                              </span>
                              <span>{selectedInstitution.affiliatedBoard}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Established</span>
                              <span>
                                {selectedInstitution.yearOfEstablishment}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Students</span>
                              <span>
                                {selectedInstitution.totalStudentStrength.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status</span>
                              <Badge
                                variant={getStatusColor(
                                  selectedInstitution.approvalStatus
                                )}
                              >
                                {selectedInstitution.approvalStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection title="Assigned Features">
                        <p className="text-sm text-gray-600">Coming soon</p>
                      </AccordionSection>

                      <AccordionSection title="Admin Users">
                        <p className="text-sm text-gray-600">Coming soon</p>
                      </AccordionSection>

                      <AccordionSection title="Student details">
                        <p className="text-sm text-gray-600">Coming soon</p>
                      </AccordionSection>

                      <AccordionSection title="Analytics summary">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 mb-1">Created</div>
                            <div>
                              {formatDate(selectedInstitution.createdAt)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 mb-1">
                              Last Updated
                            </div>
                            <div>
                              {formatDate(selectedInstitution.updatedAt)}
                            </div>
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
