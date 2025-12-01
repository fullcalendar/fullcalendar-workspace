import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/global.css'

function App() {
  return (
    <Layout
      ui='mui'
      mode='prod'
      renderEventCalendar={() => null}
      renderScheduler={() => null}
    >
    </Layout>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
