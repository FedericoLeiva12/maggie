import { Colors } from './Colors';

export const Theme = {
  colors: Colors,
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 32,
    full: 999,
  },
  spacing: {
    xxs: 2,
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: 'SpaceMono',
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 32,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 40,
    },
  },
  elevation: {
    sm: 2,
    md: 6,
    lg: 12,
  },
  shadow: {
    sm: {
      shadowColor: Colors.dark.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    md: {
      shadowColor: Colors.dark.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    lg: {
      shadowColor: Colors.dark.shadow,
      shadowOpacity: 0.32,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
    },
  },
};

export type ThemeType = typeof Theme;
