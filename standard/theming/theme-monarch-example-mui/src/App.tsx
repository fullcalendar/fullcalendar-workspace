import { useState } from 'react'
import Button from '@mui/material/Button'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Button
        onClick={() => setCount((count) => count + 1)}
        variant="contained"
      >count is {count}</Button>
      <div className='p-10 bg-gray-500'>
        Hello World
      </div>
    </div>
  )
}

export default App
