import { createRoot } from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Dialog, DialogTitle, DialogContent } from '@mui/material'
import EventCalendar from '@fullcalendar/mui/monarch/EventCalendar'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/mui/monarch/theme.css'

const theme = createTheme({ cssVariables: true })
const events = Array.from({ length: 8 }, (_, i) => ({
  id: String(i), title: `Event ${i}`, start: '2025-03-14',
}))
const calendar = (
  <EventCalendar
    initialDate="2025-03-14"
    initialView="dayGridMonth"
    dayMaxEvents={1}
    height={550}
    events={events}
  />
)
const inDialog = new URLSearchParams(location.search).get('dialog') !== '0'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {inDialog ? (
      <Dialog open maxWidth="lg" fullWidth>
        <DialogTitle>Calendar inside MUI dialog</DialogTitle>
        <DialogContent>{calendar}</DialogContent>
      </Dialog>
    ) : calendar}
  </ThemeProvider>,
)
