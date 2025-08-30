"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Save, X, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserFromToken, isAuthenticated } from "@/lib/jwt-utils";
import type { User as UserType } from "@/lib/types";

type ExtendedUser = UserType & { phone?: string; password?: string };

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [editedUser, setEditedUser] = useState<ExtendedUser | null>(null);
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
          const mergedUserData: ExtendedUser = { ...userData, ...parsedProfile };
          setUser(mergedUserData);
          setEditedUser(mergedUserData);
        } catch (error) {
          console.error("Error parsing stored profile:", error);
          setUser(userData);
          setEditedUser(userData);
        }
      } else {
        // Use data directly from JWT token payload
        const extended: ExtendedUser = { ...userData };
        setUser(extended);
        setEditedUser(extended);
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

      const updatedUser: ExtendedUser = { ...user, ...editedUser };
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

  // helpers reserved for future metadata; keeping page lean for now

  return (
    <div className="space-y-6 min-h-[calc(100vh-125px)]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile details</CardTitle>
          <div className="flex items-center gap-2">
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
                  className="bg-brand-gradient text-white hover:opacity-90"
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
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback className="font-semibold bg-brand-gradient text-white">
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

            <div className="flex-1 grid gap-6 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
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
                  <div className="mt-1 font-medium">
                    {user.name ||
                      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                      "Super Admin"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Email ID</div>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editedUser?.email || ""}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser!, email: e.target.value })
                    }
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 font-medium">{user.email || "admin@superadmin.com"}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Password</div>
                {isEditing ? (
                  <Input
                    type="password"
                    value={editedUser?.password || ""}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser!, password: e.target.value })
                    }
                    placeholder="Update password"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 font-medium tracking-widest">
                    {editedUser?.password ? "••••••••" : "••••••••"}
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <div className="text-sm text-muted-foreground">Phone number</div>
                {isEditing ? (
                  <Input
                    value={editedUser?.phone || ""}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser!, phone: e.target.value })
                    }
                    placeholder="Enter your phone number"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 font-medium">{user.phone || "+1 (555) 123-4567"}</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          className="bg-brand-gradient text-white px-8"
          onClick={() => router.push("/logout")}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
