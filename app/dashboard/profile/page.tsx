"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, Edit2, Save, X, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserFromToken, isAuthenticated } from "@/lib/jwt-utils";
import type { User as UserType } from "@/lib/types";

/**
 * Profile Page Component
 *
 * This component displays and allows editing of user profile information.
 * Instead of using mock data, it now retrieves real user data from the JWT token
 * stored in localStorage after login.
 *
 * Key features:
 * - Fetches user data from JWT token payload
 * - Persists profile updates in localStorage (since /me API endpoint is not implemented)
 * - Handles authentication state and redirects to login if not authenticated
 * - Shows loading states and error handling
 */
export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [editedUser, setEditedUser] = useState<UserType | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and get user data from token
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const userData = getUserFromToken();
    if (userData) {
      // Check if we have updated profile data in localStorage
      // This allows us to persist profile updates without a working /me API endpoint
      const storedProfile = localStorage.getItem("userProfile");
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
          // Merge token data with stored profile updates
          const mergedUserData = { ...userData, ...parsedProfile };
          setUser(mergedUserData);
          setEditedUser(mergedUserData);
        } catch (error) {
          console.error("Error parsing stored profile:", error);
          setUser(userData);
          setEditedUser(userData);
        }
      } else {
        // Use data directly from JWT token payload
        setUser(userData);
        setEditedUser(userData);
      }
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [router]);

  const handleSave = async () => {
    if (!editedUser) return;

    setSaving(true);
    try {
      // Since we don't have a working /me endpoint, we'll update local state
      // and persist changes in localStorage for future sessions
      //
      // TODO: When /me API endpoint is implemented, replace this with:
      // await apiClient.updateProfile(editedUser);

      const updatedUser = { ...user, ...editedUser };
      setUser(updatedUser);
      setIsEditing(false);

      // Store updated profile data in localStorage for persistence across sessions
      // This data will be merged with token data on next page load
      const currentToken = localStorage.getItem("authToken");
      if (currentToken) {
        localStorage.setItem("userProfile", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      // Handle error - could show a toast notification
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  if (loading) {
    return (
  <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6A1F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Unable to load profile data</p>
          <Button
            onClick={() => router.push("/login")}
            className="mt-4 bg-brand-gradient"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return "SA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and information
          </p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-gradient hover:opacity-90"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback className="text-lg font-semibold bg-brand-gradient text-white">
                  {getInitials(user.name || user.firstName)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedUser?.name || editedUser?.firstName || ""}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser!, name: e.target.value })
                      }
                      placeholder="Enter your name"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-lg font-semibold mt-1">
                      {user.name ||
                        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                        "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role || "Super Admin"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedUser?.email || ""}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser!, email: e.target.value })
                      }
                      placeholder="Enter your email"
                      type="email"
                      className="mt-1"
                    />
                  ) : (
                    <p className="flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {user.email || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={user.isActive ? "default" : "secondary"}
                      className={user.isActive ? "bg-green-500" : ""}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                User ID
              </label>
              <p className="mt-1 font-mono text-sm">
                {user.id || "Not available"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Account Created
              </label>
              <p className="mt-1">{formatDate(user.createdAt)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Updated
              </label>
              <p className="mt-1">{formatDateTime(user.updatedAt)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Login
              </label>
              <p className="mt-1">{formatDateTime(user.loginTime)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Account Status
              </label>
              <div className="mt-1 flex space-x-2">
                <Badge
                  variant={user.isActive ? "default" : "secondary"}
                  className={user.isActive ? "bg-green-500" : ""}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                {!user.isDeleted && (
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700"
                  >
                    Valid
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
