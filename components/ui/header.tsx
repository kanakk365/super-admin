"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NavIcon from "@/components/ui/nav-icon";
import Link from "next/link";
import type { User as ApiUser } from "@/lib/types";
import { getUserFromToken } from "@/lib/jwt-utils";

export default function Header() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Get user info from JWT token using shared utility
    const userData = getUserFromToken();
    setUser(userData);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-end">
        {/* Left side - Search bar */}
        

        {/* Right side - Notifications and Avatar */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="w-10 h-10 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center">
              <NavIcon
                name="notifications"
                isActive={false}
                size={20}
                className="text-gray-600"
              />
            </button>
            {/* Notification badge - you can conditionally show this */}
            {/* <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </div> */}
          </div>

          {/* User Avatar */}
          {user && (
            <Link href="/dashboard/profile" className="flex items-center">
              <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "??"}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
