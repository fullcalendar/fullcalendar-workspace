import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/global.css'
import './lib/tailwind.css'
import './lib/ui-default-fonts.js'
import './lib/ui-default.css'

const ui = 'default'
const mode = 'dev'

function App() {
  const demoChoices = useDemoChoices(ui)

  return (
    <Layout ui={ui} mode={mode} isVanilla {...demoChoices}>
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
