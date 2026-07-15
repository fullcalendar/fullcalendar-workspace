import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Container } from '@mui/material'
import EventCalendar from '@fullcalendar/mui/monarch/EventCalendar'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/mui/monarch/theme.css'

const initialDate = '2025-03-14'

const events = [
  { id: '1', title: 'All Day Event', start: '2025-03-13', allDay: true },
  { id: '2', title: 'Multi-day Event', start: '2025-03-14', end: '2025-03-16', allDay: true },
  { id: '3', title: 'Meeting', start: '2025-03-14T10:30:00', end: '2025-03-14T12:30:00' },
  { id: '4', title: 'Conference', start: '2025-03-15', allDay: true },
]

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: true,
    dark: false, // TODO: enable this, but via UI switcher
  },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container sx={{ maxWidth: 1100, mt: 3, mb: 3 }}>
        <EventCalendar
          editable
          selectable
          navLinks
          initialDate={initialDate}
          events={events}
        />
      </Container>
    </ThemeProvider>
  )
}
