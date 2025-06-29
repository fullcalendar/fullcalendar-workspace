import { createTheme } from '@mui/material'

const defaultLightTheme = createTheme()

const defaultDarkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

const purpleLightTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: '#6200ea',     // Google Purple 500
      light: '#9d46ff',    // Google Purple 300
      dark: '#0a00b6',     // Google Purple 700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#03dac6',     // Teal / Aqua Google Accent
      light: '#66fff9',
      dark: '#00a896',
      contrastText: '#000000',
    },
    error: {
      main: '#b00020',     // MD error color
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#5f5f5f',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightMedium: 500,
    button: {
      textTransform: 'uppercase',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
  },
})

const purpleDarkTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    primary: {
      main: '#bb86fc',     // Light purple (Material dark mode primary)
      light: '#efb7ff',    // Lighter purple
      dark: '#8856c3',     // Slightly deeper version
      contrastText: '#000000',
    },
    secondary: {
      main: '#03dac6',     // Aqua teal accent
      light: '#66fff9',
      dark: '#00a896',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    error: {
      main: '#cf6679',     // Material dark mode error
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
    divider: '#373737',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightMedium: 500,
    button: {
      textTransform: 'uppercase',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
  },
})

export function getMuiTheme(palette: string, colorScheme: string) {
  return palette === 'purple'
    ? (colorScheme === 'dark' ? purpleDarkTheme : purpleLightTheme)
    : (colorScheme === 'dark' ? defaultDarkTheme : defaultLightTheme)
}
