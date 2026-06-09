import { alpha } from '@mui/material/styles';

/** Base brand palette — extend here as the design system grows. */
export const brandColors = {
  background: '#FAF3DD',
  primary: '#053B06',
  secondary: '#6E9075',
} as const;

export type BrandColor = keyof typeof brandColors;

/** Derived surfaces and copy colors. */
export const semanticColors = {
  paper: '#FFFFFF',
  border: alpha(brandColors.primary, 0.12),
  divider: alpha(brandColors.secondary, 0.24),
} as const;

/** Opacity steps for overlays, hover states, and subtle fills. */
export const brandAlpha = {
  primary: {
    8: alpha(brandColors.primary, 0.08),
    12: alpha(brandColors.primary, 0.12),
    24: alpha(brandColors.primary, 0.24),
    50: alpha(brandColors.primary, 0.5),
  },
  secondary: {
    8: alpha(brandColors.secondary, 0.08),
    12: alpha(brandColors.secondary, 0.12),
    24: alpha(brandColors.secondary, 0.24),
    50: alpha(brandColors.secondary, 0.5),
  },
  background: {
    50: alpha(brandColors.background, 0.5),
    80: alpha(brandColors.background, 0.8),
  },
} as const;

export function brandColorWithAlpha(color: BrandColor, opacity: number): string {
  return alpha(brandColors[color], opacity);
}

/** CSS custom properties mirrored in Tailwind via `@theme inline`. */
export const cssVariableDefinitions = {
  '--mp-background': brandColors.background,
  '--mp-primary': brandColors.primary,
  '--mp-secondary': brandColors.secondary,
  '--mp-paper': semanticColors.paper,
  '--mp-border': semanticColors.border,
  '--mp-divider': semanticColors.divider,
  '--mp-primary-8': brandAlpha.primary[8],
  '--mp-primary-12': brandAlpha.primary[12],
  '--mp-primary-24': brandAlpha.primary[24],
  '--mp-secondary-8': brandAlpha.secondary[8],
  '--mp-secondary-12': brandAlpha.secondary[12],
  '--mp-secondary-24': brandAlpha.secondary[24],
} as const;
