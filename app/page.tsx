"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Simple token check
    const token = localStorage.getItem("authToken");

    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
  <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
      <div className="text-center">
  <div className="w-16 h-16 border-4 border-[#FF6A1F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting...</p>
      </div>
    </div>
  );
}
