import { Scheduler } from '@/components/ui/scheduler'

function App() {
  return (
    <div className='max-w-300 my-10 mx-auto'>
      <Scheduler
        addButton={{
          text: 'Add Resource'
        }}
      />
    </div>
  )
}

export default App
