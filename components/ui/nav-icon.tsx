"use client";

import { useEffect, useState, useMemo } from "react";

// Global cache for SVG content
const svgCache = new Map<string, string>();

interface NavIconProps {
  name: string;
  className?: string;
  isActive?: boolean;
  size?: number;
}

export default function NavIcon({
  name,
  className = "",
  isActive = false,
  size = 20
}: NavIconProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check if SVG is already cached
    if (svgCache.has(name)) {
      setSvgContent(svgCache.get(name)!);
      setIsLoading(false);
      return;
    }

    const loadSVG = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/icons/navigation/${name}.svg`);
        if (response.ok) {
          let content = await response.text();

          // Replace the default gray color with currentColor for CSS control
          content = content.replace(/#626262/g, 'currentColor');
          content = content.replace(/fill="#626262"/g, 'fill="currentColor"');
          content = content.replace(/stroke="#626262"/g, 'stroke="currentColor"');

          // Cache the processed SVG content
          svgCache.set(name, content);
          setSvgContent(content);
        }
      } catch (error) {
        console.error(`Failed to load icon: ${name}`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSVG();
  }, [name]);

  // Memoize the processed SVG to avoid DOM manipulation on every render
  const processedSvg = useMemo(() => {
    if (!svgContent) return null;

    // Parse SVG once and create a modified version
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');

    if (svgElement) {
      // Clone the element to avoid modifying the cached version
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;

      // Set size
      clonedSvg.setAttribute('width', size.toString());
      clonedSvg.setAttribute('height', size.toString());

      // Add classes for styling
      const existingClass = clonedSvg.getAttribute('class') || '';
      const newClass = `${existingClass} ${className} transition-colors duration-200`.trim();
      clonedSvg.setAttribute('class', newClass);

      // Ensure all fill and stroke attributes use currentColor
      const elements = clonedSvg.querySelectorAll('[fill], [stroke]');
      elements.forEach((el) => {
        if (el.getAttribute('fill') && el.getAttribute('fill') !== 'none') {
          el.setAttribute('fill', 'currentColor');
        }
        if (el.getAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
          el.setAttribute('stroke', 'currentColor');
        }
      });

      return clonedSvg.outerHTML;
    }

    return svgContent;
  }, [svgContent, size, className]);

  if (isLoading && !svgContent) {
    // Minimal fallback while loading - reduced visual impact
    return (
      <div
        className={`${className} bg-transparent`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (!processedSvg) return null;

  console.log(`Rendering ${name} icon - isActive: ${isActive}, className:`, className);

  return (
    <div
      className={`inline-flex items-center justify-center transition-colors duration-200 ${className}`}
      style={{
        width: size,
        height: size,
        color: isActive ? '#ffffff' : '#626262'
      }}
      dangerouslySetInnerHTML={{ __html: processedSvg }}
    />
  );
}
