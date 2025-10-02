"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Institution } from "@/lib/types";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type ApprovalStatus = Institution["approvalStatus"];

type StatusConfig = {
  label: string;
  buttonClass: string;
  hint: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const STATUS_CONFIG: Record<ApprovalStatus, StatusConfig> = {
  APPROVED: {
    label: "Approved",
    buttonClass:
      "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 focus-visible:ring-green-500/20",
    hint: "Active institution",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Pending Review",
    buttonClass:
      "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 focus-visible:ring-amber-500/20",
    hint: "Awaiting approval",
    icon: Clock,
  },
  REJECTED: {
    label: "Rejected",
    buttonClass:
      "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 focus-visible:ring-red-500/20",
    hint: "Needs attention",
    icon: XCircle,
  },
};

export interface ApprovalStatusPillProps {
  status: ApprovalStatus;
  onClick?: () => void;
  showHint?: boolean;
  hintOverride?: string;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function ApprovalStatusPill({
  status,
  onClick,
  showHint = false,
  hintOverride,
  className,
  size = "md",
  disabled = false,
}: ApprovalStatusPillProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size={size === "sm" ? "sm" : "default"}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "justify-start max-w-40 gap-2 rounded-full px-3 font-semibold shadow-sm transition-colors",
          config.buttonClass,
          (!onClick || disabled) && "cursor-default",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{config.label}</span>
      </Button>
      {((showHint && onClick && !disabled) || hintOverride) && (
        <span className="text-xs text-muted-foreground">
          {hintOverride ?? config.hint}
        </span>
      )}
    </div>
  );
}
