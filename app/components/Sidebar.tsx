"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import NavIcon from "@/components/ui/nav-icon";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { apiClient, handleApiError } from "@/lib/api";
import { getUserFromToken, logout } from "@/lib/jwt-utils";
import type { User as ApiUser } from "@/lib/types";
import { motion } from "motion/react";

interface NavigationItem {
  name: string;
  href: string;
  iconName: string;
  action?: string;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", iconName: "dashboard" },
  {
    name: "Institutions",
    href: "/dashboard/institutions",
    iconName: "institutions",
  },
  { name: "Students", href: "/dashboard/students", iconName: "students" },
  {
    name: "Super Institution Admin",
    href: "/dashboard/super-institution-admin",
    iconName: "super-institution-admin",
  },
  {
    name: "Assign Features",
    href: "/dashboard/assignfeatures",
    iconName: "assign-features",
  },
  { name: "Blogs", href: "/dashboard/blogs", iconName: "blogs" },
  { name: "Roles", href: "/dashboard/roles", iconName: "roles" },
];

const profileNavigation = [
  { name: "Profile", href: "/dashboard/profile", iconName: "profile" },
  { name: "Logout", href: "#", iconName: "logout", action: "logout" },
];

const NavItems = memo(({ pathname, user, handleClose, handleNavigation, memoizedNavigation, memoizedProfileNavigation }: {
  pathname: string;
  user: ApiUser | null;
  handleClose: () => void;
  handleNavigation: (item: NavigationItem) => void;
  memoizedNavigation: NavigationItem[];
  memoizedProfileNavigation: NavigationItem[];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // active state is derived inline per item

  // No manual measurements; shared-layout animation will handle transitions

  return (
    <nav className="flex flex-1 flex-col relative">
      {/* Backgrounds will be rendered per-item for shared-layout animation */}

      <ul role="list" className="flex flex-1 flex-col relative z-10">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {memoizedNavigation.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.li
                  key={item.name}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                  className="relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      transition={{ type: "spring", stiffness: 240, damping: 28, mass: 1 }}
                      className="absolute inset-0 -mx-2 bg-brand-gradient rounded-md z-0"
                    />
                  )}
                  {!isActive && hoveredIndex === index && (
                    <motion.div
                      layoutId="sidebar-hover-bg"
                      transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.9 }}
                      className="absolute inset-0 -mx-2 bg-gray-100 rounded-md z-0"
                    />
                  )}
                  <Link
                    href={item.href}
                    className={cn(
                      isActive ? "text-white" : "text-muted-foreground  hover:text-foreground",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors relative z-10",
                    )}
                    onClick={handleClose}
                  >
                    <NavIcon
                      key={`${item.iconName}-${isActive}`} // Stable key to prevent remounting
                      name={item.iconName}
                      isActive={isActive}
                      size={20}
                      className="shrink-0"
                    />
                    {item.name}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </li>

        {/* Separator line */}
        <li>
          <div className="border-t border-border my-4"></div>
          <ul role="list" className="-mx-2 space-y-1">
            {memoizedProfileNavigation.map((item, index) => {
              const isActive = pathname === item.href;
              const adjustedIndex = memoizedNavigation.length + index;
              return (
                <motion.li
                  key={item.name}
                  onMouseEnter={() => handleMouseEnter(adjustedIndex)}
                  onMouseLeave={handleMouseLeave}
                  className="relative"
                >
                  {item.action === "logout" ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigation(item)}
                      className="w-full justify-start text-muted-foreground hover:text-foreground p-2 gap-x-4 relative z-10"
                    >
                      <NavIcon
                        key={`${item.iconName}-logout`} // Stable key for logout icon
                        name={item.iconName}
                        isActive={false}
                        size={20}
                        className="shrink-0"
                      />
                      {item.name}
                    </Button>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? "text-white font-semibold"
                          : "text-muted-foreground hover:text-foreground",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors relative z-10",
                      )}
                      onClick={handleClose}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-profile-active-bg"
                          transition={{ type: "spring", stiffness: 240, damping: 28, mass: 1 }}
                          className="absolute inset-0 -mx-2 bg-brand-gradient rounded-md z-0"
                        />
                      )}
                      {!isActive && hoveredIndex === adjustedIndex && (
                        <motion.div
                          layoutId="sidebar-hover-bg"
                          transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.9 }}
                          className="absolute inset-0 -mx-2 bg-gray-100 rounded-md z-0"
                        />
                      )}
                      <NavIcon
                        key={`${item.iconName}-${isActive}`} // Stable key to prevent remounting
                        name={item.iconName}
                        isActive={isActive}
                        size={20}
                        className={cn(
                          "shrink-0",
                          isActive ? "text-white" : "text-muted-foreground"
                        )}
                      />
                      <span className={cn(
                        isActive ? "text-white font-semibold" : "text-muted-foreground font-medium",
                        "relative z-20"
                      )} style={{ color: isActive ? '#ffffff !important' : undefined }}>
                        {item.name}
                      </span>
                    </Link>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </li>

        {/* Profile Display at bottom */}
        <li className="mt-auto">
          {user && (
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 p-3 bg-accent/50 rounded-md hover:text-black hover:bg-accent transition-colors"
              onClick={handleClose}
            >
              <Avatar className="h-8 w-8">
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
              <div className="flex flex-col items-start min-w-0 flex-1">
                <div className="text-xs font-medium text-muted-foreground truncate">
                  Welcome 👋
                </div>
                <div className="text-sm text-foreground capitalize">
                  {user.name ? user.name.split(" ")[0] : "User"}
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-muted-foreground"
              />
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
});

NavItems.displayName = 'NavItems';

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    // Get user info from JWT token using shared utility
    const userData = getUserFromToken();
    setUser(userData);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // Call API logout endpoint
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", handleApiError(error));
    } finally {
      // Use shared logout utility to clear tokens and redirect
      logout();
    }
  }, []);

  const handleNavigation = useCallback((item: NavigationItem) => {
    if (item.action === "logout") {
      handleLogout();
    }
    setOpen(false);
  }, [handleLogout]);

  const handleClose = useCallback(() => setOpen(false), []);

  // Memoize navigation data to prevent unnecessary re-renders
  const memoizedNavigation = useMemo(() => navigation, []);
  const memoizedProfileNavigation = useMemo(() => profileNavigation, []);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-56 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-card px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-foreground">Super Admin</h1>
          </div>
          <NavItems
            pathname={pathname}
            user={user}
            handleClose={handleClose}
            handleNavigation={handleNavigation}
            memoizedNavigation={memoizedNavigation}
            memoizedProfileNavigation={memoizedProfileNavigation}
          />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="flex items-center gap-x-4 border-b bg-card px-4 py-4 shadow-sm">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                  <h1 className="text-xl font-bold text-foreground">
                    Super Admin
                  </h1>
                </div>
                <NavItems
                  pathname={pathname}
                  user={user}
                  handleClose={handleClose}
                  handleNavigation={handleNavigation}
                  memoizedNavigation={memoizedNavigation}
                  memoizedProfileNavigation={memoizedProfileNavigation}
                />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-sm font-semibold leading-6 text-foreground">
            Super Admin
          </div>
        </div>
      </div>
    </>
  );
}
