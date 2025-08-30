import React from "react";
import { IconProps, IconSize, getIconSize, defaultIconProps } from "./types";

/**
 * Merges default icon props with provided props
 */
export const mergeIconProps = (props: IconProps): Required<IconProps> => {
  return {
    ...defaultIconProps,
    ...props,
    width: props.width || defaultIconProps.width!,
    height: props.height || defaultIconProps.height!,
    fill: props.fill || defaultIconProps.fill!,
    viewBox: props.viewBox || defaultIconProps.viewBox!,
    className: props.className || "",
    stroke: props.stroke || "none",
    strokeWidth: props.strokeWidth || 0,
  };
};

/**
 * Creates a standardized className string for icons
 */
export const createIconClassName = (
  baseClassName: string = "",
  size?: IconSize,
  additionalClasses?: string,
): string => {
  const classes = [baseClassName];

  if (size) {
    const sizeValue = getIconSize(size);
    classes.push(`w-${sizeValue} h-${sizeValue}`);
  }

  if (additionalClasses) {
    classes.push(additionalClasses);
  }

  return classes.filter(Boolean).join(" ");
};

/**
 * Generates the public path for an SVG icon
 */
export const getIconPath = (
  category: "ui" | "navigation" | "actions" | "decorative",
  filename: string,
): string => {
  const extension = filename.endsWith(".svg") ? "" : ".svg";
  return `/icons/${category}/${filename}${extension}`;
};

/**
 * Creates props for an SVG icon with size utilities
 */
export const createIconProps = (
  size: IconSize = "md",
  className?: string,
  overrides?: Partial<IconProps>,
): IconProps => {
  const sizeValue = getIconSize(size);

  return {
    width: sizeValue,
    height: sizeValue,
    className: createIconClassName("", undefined, className),
    ...defaultIconProps,
    ...overrides,
  };
};

/**
 * Validates if a string is a valid SVG content
 */
export const isValidSVG = (content: string): boolean => {
  return content.trim().startsWith("<svg") && content.trim().endsWith("</svg>");
};

/**
 * Extracts viewBox from SVG string
 */
export const extractViewBox = (svgContent: string): string | null => {
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
  return viewBoxMatch ? viewBoxMatch[1] : null;
};

/**
 * Creates a React component wrapper for inline SVG
 */
export const createSVGComponent = (
  svgContent: string,
  displayName?: string,
): React.FC<IconProps> => {
  const component: React.FC<IconProps> = (props) => {
    const mergedProps = mergeIconProps(props);

    // Extract the inner content of the SVG (everything between <svg> tags)
    const innerSVG = svgContent
      .replace(/<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "");

    return React.createElement("svg", {
      width: mergedProps.width,
      height: mergedProps.height,
      viewBox: mergedProps.viewBox,
      fill: mergedProps.fill,
      stroke: mergedProps.stroke,
      strokeWidth: mergedProps.strokeWidth,
      className: mergedProps.className,
      dangerouslySetInnerHTML: { __html: innerSVG },
    });
  };

  if (displayName) {
    component.displayName = displayName;
  }

  return component;
};
