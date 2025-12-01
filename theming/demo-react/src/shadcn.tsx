import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Layout } from './lib/layout.js'

import './lib/tailwind.css'
import './lib/ui-shadcn-fonts.js'
import './lib/ui-shadcn.css'

function App() {
  return (
    <Layout ui='shadcn' mode='prod'>
    </Layout>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
