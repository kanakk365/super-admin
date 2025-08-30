"use client";

import { useState, useEffect } from "react";
import type { JSX } from "react";
import { API_CONFIG } from "@/lib/api";
import type { ApiStatusState, HealthCheckResponse } from "@/lib/types";

interface ApiStatusProps {
  className?: string;
  showUrl?: boolean;
}

export default function ApiStatus({
  className = "",
  showUrl = true,
}: ApiStatusProps) {
  const [status, setStatus] = useState<ApiStatusState>({
    connected: false,
    loading: true,
  });

  useEffect(() => {
    const checkApiStatus = async (): Promise<void> => {
      setStatus((prev) => ({ ...prev, loading: true }));

      const startTime = Date.now();

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          try {
            (await response.json()) as HealthCheckResponse;
            setStatus({
              connected: true,
              loading: false,
              responseTime,
              lastChecked: new Date().toISOString(),
            });
          } catch {
            // If JSON parsing fails, still consider it connected
            setStatus({
              connected: true,
              loading: false,
              responseTime,
              lastChecked: new Date().toISOString(),
            });
          }
        } else {
          setStatus({
            connected: false,
            loading: false,
            error: `HTTP ${response.status}`,
            responseTime,
            lastChecked: new Date().toISOString(),
          });
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        setStatus({
          connected: false,
          loading: false,
          error: error instanceof Error ? error.message : "Connection failed",
          responseTime,
          lastChecked: new Date().toISOString(),
        });
      }
    };

    checkApiStatus();

    // Check API status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (): string => {
    if (status.loading) return "text-yellow-400";
    return status.connected ? "text-green-400" : "text-red-400";
  };

  const getStatusIcon = (): JSX.Element => {
    if (status.loading) {
      return (
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
      );
    }

    return (
      <div
        className={`w-2 h-2 rounded-full ${
          status.connected ? "bg-green-400" : "bg-red-400"
        }`}
      ></div>
    );
  };

  const getStatusText = (): string => {
    if (status.loading) return "Checking...";
    if (status.connected) {
      return status.responseTime
        ? `Connected (${status.responseTime}ms)`
        : "Connected";
    }
    return status.error || "Disconnected";
  };

  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      {getStatusIcon()}
      <span className={getStatusColor()}>API: {getStatusText()}</span>
      {showUrl && (
        <span className="text-gray-500 hidden md:inline">
          • {API_CONFIG.BASE_URL}
        </span>
      )}
    </div>
  );
}
