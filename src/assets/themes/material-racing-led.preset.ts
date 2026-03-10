import { definePreset } from '@primeuix/themes';
import Material from '@primeuix/themes/material';

export const MaterialRacingLedPreset = definePreset(Material, {
  semantic: {
    primary: {
      50: '#fdf8e9',
      100: '#f9edc5',
      200: '#f5e39f',
      300: '#eed26d',
      400: '#e4bf3f',
      500: '#d4a934',
      600: '#b88922',
      700: '#8f6916',
      800: '#6d4f10',
      900: '#4d370a',
      950: '#2a1d05',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8f8f6',
          100: '#efefea',
          200: '#ddddd2',
          300: '#c4c4b3',
          400: '#9f9f8a',
          500: '#7f7f67',
          600: '#66664f',
          700: '#4f4f3d',
          800: '#3b3b2e',
          900: '#23231d',
          950: '#161611',
        },
      },
      dark: {
        surface: {
          0: '#111006',
          50: '#1a180b',
          100: '#252111',
          200: '#332c18',
          300: '#453a20',
          400: '#5d4c29',
          500: '#786236',
          600: '#9f8243',
          700: '#c6a14e',
          800: '#ddbe77',
          900: '#ece5cf',
          950: '#ffffff',
        },
      },
    },
  },
});