export interface IconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  viewBox?: string;
}

export interface SVGIconComponent extends React.FC<IconProps> {
  displayName?: string;
}

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface IconSizeMap {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export const iconSizes: IconSizeMap = {
  xs: '12',
  sm: '16',
  md: '20',
  lg: '24',
  xl: '32',
  '2xl': '48',
};

export const getIconSize = (size: IconSize = 'md'): string => {
  return iconSizes[size];
};

export const defaultIconProps: Partial<IconProps> = {
  width: 24,
  height: 24,
  fill: 'currentColor',
  viewBox: '0 0 24 24',
};
