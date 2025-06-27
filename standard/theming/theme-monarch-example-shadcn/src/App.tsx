import { useState } from 'react'
import './App.css'
import { Button } from '@/components/ui/button.js'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button onClick={() => setCount((count) => count + 1)}>Count: {count}</Button>
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </div>
  )
}

export default App
