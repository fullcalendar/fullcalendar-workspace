import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Container } from '@mui/material'
import ResourceTimeline from '@fullcalendar/mui/monarch/ResourceTimeline'
import ResourceTimeGrid from '@fullcalendar/mui/monarch/ResourceTimeGrid'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/mui/monarch/theme.css'

const initialDate = '2025-03-14'

const events = [
  { id: '1', resourceId: 'a', title: 'Meeting', start: '2025-03-13T10:00:00', end: '2025-03-13T11:30:00' },
  { id: '2', resourceId: 'b', title: 'Workshop', start: '2025-03-13T09:00:00', end: '2025-03-13T12:00:00' },
  { id: '3', resourceId: 'c', title: 'Training', start: '2025-03-14T13:00:00', end: '2025-03-14T15:00:00' },
  { id: '4', resourceId: 'a', title: 'Standup', start: '2025-03-14T08:30:00', end: '2025-03-14T10:00:00' },
  { id: '5', resourceId: 'b', title: 'Review', start: '2025-03-15T14:00:00', end: '2025-03-15T16:00:00' },
]

const resources = [
  { id: 'a', title: 'Room A' },
  { id: 'b', title: 'Room B' },
  { id: 'c', title: 'Room C' },
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
        <ResourceTimeline
          initialDate={initialDate}
          resources={resources}
          events={events}
          editable
          selectable
          navLinks
        />
      </Container>
      <Container sx={{ maxWidth: 1100, mt: 3, mb: 3 }}>
        <ResourceTimeGrid
          initialDate={initialDate}
          resources={resources}
          events={events}
          editable
          selectable
          navLinks
        />
      </Container>
    </ThemeProvider>
  )
}
