import { EventCalendar } from '@/components/ui/event-calendar'

function App() {
  return (
    <div className='max-w-300 my-10 mx-auto'>
      <EventCalendar
        addButton={{
          text: 'Add Event'
        }}
      />
    </div>
  )
}

export default App
