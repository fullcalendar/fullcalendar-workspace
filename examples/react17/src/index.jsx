import React from 'react'
import { render } from 'react-dom'
import DemoApp from './DemoApp'
import './index.css'

render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>,
  document.getElementById('root')
)
