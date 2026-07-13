import { createTheme } from '@mui/material/styles';

/**
 * Thème Material UI de l'application — référence visuelle commune à tous les modules.
 * Palette : bleu « transport » profond + accent ambré.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a5f',
      light: '#3d5a80',
      dark: '#14283f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e08a1e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    success: { main: '#2e7d32' },
    error: { main: '#c62828' },
    warning: { main: '#ed6c02' },
    info: { main: '#0277bd' },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#1e3a5f' },
      },
    },
  },
});
