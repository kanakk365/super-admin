"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated as checkIsAuthenticated,
  clearAuthTokens,
} from "@/lib/jwt-utils";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = checkIsAuthenticated();

      if (authenticated) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Clear any invalid tokens
        clearAuthTokens();
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      fallback || (
  <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#FF6A1F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
