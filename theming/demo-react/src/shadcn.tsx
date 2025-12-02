import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/global.css'
import './lib/tailwind.css'
import './lib/ui-shadcn-fonts.js'
import './lib/ui-shadcn.css'

const ui = 'shadcn'
const mode = 'prod'

function App() {
  const demoChoices = useDemoChoices(ui)

  return (
    <Layout ui={ui} mode={mode} {...demoChoices}>
      <DemoGenerator
        renderEventCalendar={() => null}
        renderScheduler={() => null}
      />
    </Layout>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
