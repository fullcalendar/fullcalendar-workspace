import { createRoot } from 'react-dom/client'
import { Dialog } from 'radix-ui'
import { EventCalendar } from './components/event-calendar'
import '@fullcalendar/react/skeleton.css'
import './index.css'

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
  inDialog ? (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed z-50 top-10 left-10 right-10 bg-background p-5">
          <Dialog.Title>Calendar inside Radix dialog</Dialog.Title>
          <Dialog.Description>Popover stacking review</Dialog.Description>
          {calendar}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : calendar,
)
