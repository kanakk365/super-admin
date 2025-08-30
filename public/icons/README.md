# SVG Icons System

This directory contains SVG icons organized for the Super Admin dashboard. The icons are categorized and can be used throughout the application with the provided utilities.

## Directory Structure

```
public/icons/
├── ui/           # UI elements (buttons, forms, etc.)
├── navigation/   # Navigation icons (menu, arrows, etc.)
├── actions/      # Action icons (save, delete, edit, etc.)
├── decorative/   # Decorative patterns and overlays
└── README.md     # This file
```

## Icon Categories

### UI Icons (`/icons/ui/`)
Icons for user interface elements like buttons, form controls, indicators, etc.

### Navigation Icons (`/icons/navigation/`)
Icons for navigation elements like menu items, breadcrumbs, pagination, etc.

### Actions Icons (`/icons/actions/`)
Icons representing user actions like save, delete, edit, create, etc.

### Decorative Icons (`/icons/decorative/`)
Decorative patterns, overlays, and background elements.

## Usage

### 1. Direct SVG Usage
```tsx
import Image from 'next/image';

// Using Next.js Image component
<Image 
  src="/icons/ui/dashboard.svg" 
  alt="Dashboard" 
  width={24} 
  height={24} 
/>

// Using HTML img tag
<img src="/icons/actions/save.svg" alt="Save" width="20" height="20" />
```

### 2. Using the Icon Utilities
```tsx
import { getIconPath, createIconProps } from '@/lib/icons';

// Get icon path
const iconPath = getIconPath('ui', 'dashboard');

// Create standardized props
const iconProps = createIconProps('md', 'text-blue-500');
```

### 3. Inline SVG with Utilities
```tsx
import { createSVGComponent } from '@/lib/icons';

// Convert SVG string to React component
const MyIcon = createSVGComponent(svgContent, 'MyIcon');

// Use as component
<MyIcon className="w-6 h-6 text-gray-500" />
```

## Icon Guidelines

### Naming Convention
- Use kebab-case for filenames
- Be descriptive and specific
- Include context when necessary

Examples:
- `user-profile.svg`
- `navigation-menu.svg`
- `action-delete.svg`
- `overlay-pattern.svg`

### Technical Requirements
- **Format**: SVG
- **Size**: Preferably 24x24px base size
- **ViewBox**: Use consistent viewBox (e.g., "0 0 24 24")
- **Colors**: Use `currentColor` for fills/strokes when possible
- **Optimization**: Optimize SVGs before adding (remove unnecessary metadata)

### SVG Best Practices
```svg
<!-- Good: Uses currentColor and proper viewBox -->
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="..." fill="currentColor"/>
</svg>

<!-- Better: Includes title for accessibility -->
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>Dashboard Icon</title>
  <path d="..." fill="currentColor"/>
</svg>
```

## Icon Sizes

The utility system supports these standard sizes:
- `xs`: 12px
- `sm`: 16px  
- `md`: 20px (default)
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

## Adding New Icons

1. **Optimize** your SVG using tools like SVGO
2. **Choose** the appropriate category folder
3. **Name** the file following the naming convention
4. **Test** the icon in different contexts (light/dark themes)
5. **Document** any special usage requirements

## Icon Optimization Tools

- [SVGO](https://jakearchibald.github.io/svgomg/) - Online SVG optimizer
- [SVG Optimizer](https://petercollingridge.appspot.com/svg-optimiser) - Alternative optimizer
- [Adobe Illustrator](https://www.adobe.com/products/illustrator.html) - Export optimized SVGs

## Examples

### Simple Icon Usage
```tsx
// Dashboard component
<Image 
  src="/icons/navigation/dashboard.svg"
  alt="Dashboard"
  width={20}
  height={20}
  className="text-blue-500"
/>
```

### Dynamic Icon Loading
```tsx
const IconLoader = ({ category, name, size = 'md' }) => {
  const iconPath = getIconPath(category, name);
  const iconProps = createIconProps(size);
  
  return (
    <Image 
      src={iconPath}
      alt={name}
      {...iconProps}
    />
  );
};
```

### Custom Icon Component
```tsx
interface CustomIconProps {
  name: string;
  category: IconCategory;
  size?: IconSize;
  className?: string;
}

const CustomIcon: React.FC<CustomIconProps> = ({ 
  name, 
  category, 
  size = 'md', 
  className 
}) => {
  const iconPath = getIconPath(category, name);
  const iconProps = createIconProps(size, className);
  
  return (
    <Image 
      src={iconPath}
      alt={name}
      {...iconProps}
    />
  );
};

// Usage
<CustomIcon 
  name="user-profile" 
  category="ui" 
  size="lg" 
  className="text-gray-600" 
/>
```

## Troubleshooting

### Common Issues

1. **Icon not displaying**: Check file path and ensure the SVG exists
2. **Wrong size**: Verify viewBox and size props are correct
3. **Color not changing**: Ensure SVG uses `currentColor` or CSS-compatible color properties
4. **Performance issues**: Optimize SVG files and consider using sprite sheets for many icons

### Performance Tips

- Use Next.js `Image` component for automatic optimization
- Consider icon sprites for frequently used icons
- Lazy load decorative icons that aren't immediately visible
- Use appropriate sizes to avoid unnecessary scaling