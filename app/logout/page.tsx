"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient, handleApiError } from "@/lib/api";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call API logout endpoint
        await apiClient.logout();
      } catch (error) {
        console.error("Logout error:", handleApiError(error));
      } finally {
        // Clear localStorage token
        localStorage.removeItem("authToken");

        // Clear cookie token
        document.cookie =
          "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      }
    };

    performLogout();
  }, [router]);

  return (
  <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
      <div className="text-center">
  <div className="w-16 h-16 border-4 border-[#FF6A1F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Logging out...</p>
  <p className="text-sky-200 text-sm mt-2">
          You will be redirected to the login page
        </p>
      </div>
    </div>
  );
}
