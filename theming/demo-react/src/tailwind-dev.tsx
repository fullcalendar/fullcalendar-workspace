import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Layout } from './lib/layout.js'

import '@fontsource-variable/inter' // for ui-default theme-breezy
import './lib/tailwind.css'
import './lib/ui-default.css'

function App() {
  return (
    <Layout>
      This is a test
    </Layout>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
