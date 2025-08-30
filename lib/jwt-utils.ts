import type { User } from "./types";

// JWT token payload interface
interface JWTPayload {
  sub?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  iat?: number;
  exp?: number;
  updatedAt?: string;
  loginTime?: string;
  [key: string]: unknown;
}

// JWT token decoder utility
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

// Get user data from JWT token stored in localStorage
export const getUserFromToken = (): User | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("authToken");
  if (!token) return null;

  const decoded = decodeJWT(token);
  if (!decoded) return null;

  return {
    id: decoded.sub || decoded.id || "unknown",
    name:
      decoded.name ||
      `${decoded.firstName || ""} ${decoded.lastName || ""}`.trim() ||
      "User",
    firstName: decoded.firstName,
    lastName: decoded.lastName,
    email: decoded.email || "",
    role: decoded.role || "admin",
    isActive: decoded.isActive !== false,
    isDeleted: decoded.isDeleted || false,
    createdAt: decoded.iat
      ? new Date(decoded.iat * 1000).toISOString()
      : undefined,
    updatedAt: decoded.updatedAt,
    loginTime: decoded.loginTime,
  };
};

// Check if user is authenticated by validating token
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("authToken");
  if (!token) return false;

  const decoded = decodeJWT(token);
  if (!decoded) return false;

  // Validate token structure
  if (!decoded.email && !decoded.sub && !decoded.id) {
    return false;
  }

  // Check if token is expired
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    // Token is expired, remove it
    localStorage.removeItem("authToken");
    document.cookie =
      "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    return false;
  }

  return true;
};

// Get token expiration date
export const getTokenExpiration = (): Date | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("authToken");
  if (!token) return null;

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return null;

  return new Date(decoded.exp * 1000);
};

// Clear authentication tokens from storage
export const clearAuthTokens = (): void => {
  if (typeof window === "undefined") return;

  // Clear localStorage
  localStorage.removeItem("authToken");
  localStorage.removeItem("userProfile");

  // Clear cookies
  document.cookie =
    "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
};

// Logout user by clearing token and redirecting
export const logout = (): void => {
  clearAuthTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Check if token exists (without validation)
export const hasToken = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("authToken");
};

// Get raw token string
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

// Set token in storage
export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem("authToken", token);
  document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Strict`;
};
