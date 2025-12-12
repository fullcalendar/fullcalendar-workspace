import { EventCalendar } from '@/components/ui/event-calendar'

const msInDay = 1000 * 60 * 60 * 24
const nowDate = new Date()
const startOfDay = new Date(nowDate.getTime())
startOfDay.setHours(0, 0, 0, 0)

const events = [
  {
    title: 'Right Now',
    start: nowDate,
  },
  {
    title: 'Multiple Days',
    start: startOfDay,
    end: new Date(startOfDay.getTime() + msInDay * 3),
    allDay: true,
  },
  {
    title: 'Past Event',
    start: new Date(nowDate.getTime() - msInDay * 8),
  },
  {
    title: 'Future Event',
    start: new Date(startOfDay.getTime() + msInDay * 7),
    allDay: true,
  },
]

function App() {
  return (
    <div className='max-w-300 my-10 mx-auto'>
      <EventCalendar
        events={events}
        editable
        nowIndicator
        weekNumbers
        navLinks
        navLinkDayClick='timeGridDay' // TODO: bake these into shadcn component?
        navLinkWeekClick='timeGridWeek' //
        addButton={{
          text: 'Add Event',
          click() {
            alert('add event...')
          }
        }}
      />
    </div>
  )
}

export default App
