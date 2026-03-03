import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Container } from '@mui/material'
import EventCalendar from '@fullcalendar/mui/monarch/EventCalendar'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/mui/monarch/theme.css'

const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container sx={{ maxWidth: 1100, mt: 3, mb: 3 }}>
        <EventCalendar
          selectable
          navLinks
        />
      </Container>
    </ThemeProvider>
  )
}
