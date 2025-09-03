"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { apiClient, handleApiError } from "@/lib/api";
import { setToken } from "@/lib/jwt-utils";
import type { LoginCredentials, AuthResponse } from "@/lib/types";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Login request
      const credentials: LoginCredentials = {
        email: formData.email,
        password: formData.password,
      };

      const response: AuthResponse = await apiClient.login(credentials);

      // Debug logging
      console.log("Login response received:", response);
      console.log("Response success:", response.success);
      console.log("Response data:", response.data);
      console.log("Response admin:", response.data?.admin);
      console.log("Response token:", response.data?.token);

      if (response.success && response.data?.admin && response.data?.token) {
        // Store token using utility function
        setToken(response.data.token);

        // Debug token storage
        console.log("Token stored:", response.data.token);
        console.log("Token retrieved:", localStorage.getItem("authToken"));

        console.log("Login successful, redirecting to dashboard");
        // Success - redirect to dashboard
        router.push("/dashboard");
      } else {
        console.log("Login failed, showing error");
        setError(response.message || response.error || "Login failed");
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <Card className="shadow-xl backdrop-blur rounded-2xl border border-slate-100">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
              Sign in to your Account
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Enter your email to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="E mail Id"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12 rounded-lg bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 text-slate-900 placeholder:text-slate-500 px-4 transition"
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="h-12 rounded-lg bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 text-slate-900 placeholder:text-slate-500 pr-10 px-4 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-medium shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
