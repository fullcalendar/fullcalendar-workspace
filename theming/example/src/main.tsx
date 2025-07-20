import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './index.css'

import App from './App.js'

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
