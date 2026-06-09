import { createTheme } from '@mui/material/styles';
import { brandAlpha, brandColors, semanticColors } from './tokens';

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: brandColors.background,
      paper: semanticColors.paper,
    },
    primary: {
      main: brandColors.primary,
      light: brandAlpha.primary[24],
      dark: brandColors.primary,
      contrastText: brandColors.background,
    },
    secondary: {
      main: brandColors.secondary,
      light: brandAlpha.secondary[24],
      dark: brandColors.secondary,
      contrastText: brandColors.background,
    },
    text: {
      primary: brandColors.primary,
      secondary: brandColors.secondary,
    },
    divider: semanticColors.divider,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brandColors.background,
          color: brandColors.primary,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: brandColors.secondary,
          },
        },
      },
    },
  },
});
