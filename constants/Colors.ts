/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const primaryLight = '#0a7ea4';
const primaryDark = '#22d3ee';
const linkLight = '#0a7ea4';
const linkDark = '#22d3ee';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    tint: tintColorLight,
    primary: primaryLight,
    primaryText: '#ffffff',
    link: linkLight,
    muted: '#6B7280',
    card: '#F8FAFC',
    border: '#E5E7EB',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    accent: '#6366F1',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E42',
    shadow: 'rgba(0,0,0,0.08)',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    surface: '#23272F',
    tint: primaryDark,
    primary: primaryDark,
    primaryText: '#0b1220',
    link: linkDark,
    muted: '#9BA1A6',
    card: '#1b1f22',
    border: '#2a2f34',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#22d3ee',
    accent: '#818CF8',
    error: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    shadow: 'rgba(0,0,0,0.32)',
  },
};
