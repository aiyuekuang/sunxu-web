export const SunxuWebColors = {
  light: {
    primary: '#007D35',
    primarySurface: '#E6F7EC',
    background: '#F5F6F8',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#EBEBEB',
    success: '#00B578',
    warning: '#FF8F1F',
    error: '#FF3141',
    info: '#1677FF',
  },
  dark: {
    primary: '#1F7A45',
    primarySurface: '#10271A',
    background: '#0F0F0F',
    surface: '#1C1C1E',
    text: '#F5F5F5',
    textSecondary: '#ABABAB',
    textMuted: '#787878',
    border: '#2C2C2E',
    success: '#00D68F',
    warning: '#FFAA00',
    error: '#FF4D4F',
    info: '#4096FF',
  },
} as const;

export type SunxuAppearance = keyof typeof SunxuWebColors;
