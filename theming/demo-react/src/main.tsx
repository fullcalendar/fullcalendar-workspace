import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/inter'
import './index.css'

import App from './App.js'

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
