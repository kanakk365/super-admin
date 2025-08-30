"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Calendar,
  Upload,
  X,
  User,
  FileText,
  ArrowLeft,
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

interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  coverImageKey: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedDate: string | null;
  createdAt: string;
  updatedAt: string;
  coverImageUrl: string;
}

interface BlogsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: Blog[];
}

interface BlogStats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
}

interface BlogFormData {
  title: string;
  content: string;
  author: string;
  status: "DRAFT" | "PUBLISHED";
  coverImage: File | null;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED">("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [stats, setStats] = useState<BlogStats>({
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
  });

  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    content: "",
    author: "",
    status: "DRAFT",
    coverImage: null,
  });

  // Fetch blogs from API
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Get token from localStorage
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/super-admin/blogs`,
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

      const data: BlogsResponse = await response.json();

      if (data.success) {
        setBlogs(data.data);

        // Calculate stats
        const total = data.data.length;
        const published = data.data.filter(
          (blog) => blog.status === "PUBLISHED",
        ).length;
        const drafts = data.data.filter(
          (blog) => blog.status === "DRAFT",
        ).length;
        const archived = data.data.filter(
          (blog) => blog.status === "ARCHIVED",
        ).length;

        setStats({ total, published, drafts, archived });
      } else {
        setError(data.message || "Failed to fetch blogs");
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new blog
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.author) {
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
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("author", formData.author);
      formDataToSend.append("status", formData.status);

      if (formData.coverImage) {
        formDataToSend.append("coverImage", formData.coverImage);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/super-admin/blogs`,
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
        // Reset form
        setFormData({
          title: "",
          content: "",
          author: "",
          status: "DRAFT",
          coverImage: null,
        });
        setShowCreateForm(false);

        // Refresh blogs list
        await fetchBlogs();
      } else {
        setError(data.message || "Failed to create blog");
      }
    } catch (err) {
      console.error("Error creating blog:", err);
      setError(handleApiError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, coverImage: file }));
  };

  // Filter blogs based on search term and status
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || blog.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

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

  // Handle blog actions
  const handleBlogAction = async (
    blogId: string,
    action: "view" | "edit" | "delete",
  ) => {
    switch (action) {
      case "view":
        const blog = blogs.find((b) => b.id === blogId);
        if (blog) {
          setSelectedBlog(blog);
          setViewMode("detail");
        }
        break;
      case "edit":
        console.log(`Editing blog ${blogId}`);
        // TODO: Implement edit blog functionality
        break;
      case "delete":
        const confirmed = window.confirm(
          "Are you sure you want to delete this blog post?",
        );
        if (confirmed) {
          console.log(`Deleting blog ${blogId}`);
          // TODO: Implement delete blog functionality
          // await deleteBlog(blogId);
          // await fetchBlogs();
        }
        break;
    }
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedBlog(null);
    setViewMode("list");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "DRAFT":
        return "secondary";
      case "ARCHIVED":
        return "outline";
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

  // Load blogs on component mount
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

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
                  Blog Details
                </h1>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className=" text-lg text-neutral-700 mr-4">
                  All Blog Posts
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
                  variant={statusFilter === "PUBLISHED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("PUBLISHED")}
                  className={
                    statusFilter === "PUBLISHED"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  Published ({stats.published})
                </Button>
                <Button
                  variant={statusFilter === "DRAFT" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("DRAFT")}
                  className={
                    statusFilter === "DRAFT"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  Drafts ({stats.drafts})
                </Button>
                <Button
                  variant={statusFilter === "ARCHIVED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("ARCHIVED")}
                  className={
                    statusFilter === "ARCHIVED"
                      ? "bg-brand-gradient text-white rounded-full"
                      : "bg-brand-gradient-faint text-[#B85E00] rounded-full"
                  }
                >
                  Archived ({stats.archived})
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
                  placeholder="Search blog posts..."
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
                  New Blog Post
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Create Blog Form */}
      {showCreateForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Create New Blog Post</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBlog} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter blog title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    placeholder="Enter author name"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        author: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Enter blog content"
                  className="min-h-[120px]"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "DRAFT" | "PUBLISHED") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Cover Image</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-muted"
                    />
                    {formData.coverImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, coverImage: null }))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {formData.coverImage && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {formData.coverImage.name}
                    </p>
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
                      <Upload className="mr-2 h-4 w-4" />
                      Create Blog Post
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

      {/* Blog Posts List or Detail View */}
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
                        onClick={fetchBlogs}
                        variant="outline"
                        size="sm"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}

                {/* Blog Posts List */}
                {!loading && !error && (
                  <>
                    {filteredBlogs.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter !== "ALL"
                            ? `No blog posts found matching ${
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
                            : "No blog posts found."}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-100">
                                <TableHead className="text-gray-900 min-w-[250px] px-4">
                                  Title
                                </TableHead>
                                <TableHead className="text-gray-900 min-w-[150px] px-4">
                                  Author
                                </TableHead>
                                <TableHead className="text-gray-900 min-w-[100px] px-4">
                                  Status
                                </TableHead>
                                <TableHead className="text-gray-900 min-w-[120px] px-4">
                                  Published
                                </TableHead>
                                <TableHead className="text-gray-900 text-right min-w-[100px] px-4">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedBlogs.map((blog) => (
                                <TableRow
                                  key={blog.id}
                                  className="hover:bg-gray-50"
                                >


                                  {/* Title Column */}
                                  <TableCell className="px-4">
                                    <div>
                                      <h3 className=" text-base text-gray-900 mb-1">
                                        {blog.title}
                                      </h3>
                                    </div>
                                  </TableCell>

                                  {/* Author Column */}
                                  <TableCell className="px-4">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <User className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate min-w-0">
                                        {blog.author}
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* Status Column */}
                                  <TableCell className="px-4">
                                    <Badge
                                      variant={getStatusColor(blog.status)}
                                    >
                                      {blog.status}
                                    </Badge>
                                  </TableCell>

                                  {/* Published Column */}
                                  <TableCell className="px-4">
                                    <div className="text-sm text-gray-600">
                                      {blog.publishedDate
                                        ? formatDate(blog.publishedDate)
                                        : formatDate(blog.createdAt)}
                                    </div>
                                  </TableCell>

                                  {/* Actions Column */}
                                  <TableCell className="text-right px-4">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleBlogAction(blog.id, "view")
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
                    {filteredBlogs.length > 0 && (
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
                            <span className="text-sm text-muted-foreground">of {filteredBlogs.length} blog posts</span>
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
            /* Blog Detail View */
            <Card className="py-0">
              <CardContent className="p-8">
                {selectedBlog && (
                  <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-6">
                        {/* Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-12 w-12 text-gray-400" />
                        </div>

                        {/* Blog Info */}
                        <div className="flex-1">
                          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                            {selectedBlog.title}
                          </h1>
                          <p className="text-xl text-gray-600 mb-4">
                            Blog Post
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={getStatusColor(selectedBlog.status)}
                        className="text-sm"
                      >
                        {selectedBlog.status}
                      </Badge>
                    </div>

                    {/* Accordion sections */}
                    <div className="space-y-3">
                      <AccordionSection title="Overview" defaultOpen>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Author</p>
                                <p className="font-medium">{selectedBlog.author}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600">Created</p>
                                <p className="font-medium">{formatDate(selectedBlog.createdAt)}</p>
                              </div>
                            </div>
                            {selectedBlog.publishedDate && (
                              <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm text-gray-600">Published</p>
                                  <p className="font-medium">{formatDate(selectedBlog.publishedDate)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Status</span><Badge variant={getStatusColor(selectedBlog.status)}>{selectedBlog.status}</Badge></div>
                            <div className="flex justify-between"><span className="text-gray-600">Last Updated</span><span>{formatDate(selectedBlog.updatedAt)}</span></div>
                            {selectedBlog.coverImageUrl && (
                              <div className="flex justify-between"><span className="text-gray-600">Cover Image</span><span className="text-blue-600 hover:text-blue-800"><a href={selectedBlog.coverImageUrl} target="_blank" rel="noopener noreferrer">View Image</a></span></div>
                            )}
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection title="Content">
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                            {selectedBlog.content}
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection title="Statistics">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 mb-1">Word Count</div>
                            <div>{selectedBlog.content.split(/\s+/).length} words</div>
                          </div>
                          <div>
                            <div className="text-gray-600 mb-1">Character Count</div>
                            <div>{selectedBlog.content.length} characters</div>
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
