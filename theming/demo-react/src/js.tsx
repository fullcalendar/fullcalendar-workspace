import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Layout } from './lib/layout.js'

import './lib/ui-default-fonts.js'
import './lib/ui-default.css'

function App() {
  return (
    <Layout ui='default' mode='prod' isVanilla>
    </Layout>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
