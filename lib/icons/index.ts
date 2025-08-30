// Main exports for the icons library
export * from "./types";
export * from "./utils";

// Re-export commonly used utilities
export {
  mergeIconProps,
  createIconClassName,
  getIconPath,
  createIconProps,
  createSVGComponent,
} from "./utils";

export { iconSizes, getIconSize, defaultIconProps } from "./types";

// Default icon categories
export const ICON_CATEGORIES = {
  UI: "ui",
  NAVIGATION: "navigation",
  ACTIONS: "actions",
  DECORATIVE: "decorative",
} as const;

export type IconCategory =
  (typeof ICON_CATEGORIES)[keyof typeof ICON_CATEGORIES];
