import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useDemoChoices } from './lib/demo-choices.js'
import { Demos } from './lib/demos.js'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/global.css'
import './lib/tailwind.css'
import './lib/ui-default-fonts.js'
import './lib/ui-default.css'

const ui = 'default'
const mode = 'compiled'

function App() {
  const demoChoices = useDemoChoices(ui)

  return (
    <Layout ui={ui} mode={mode} isVanilla {...demoChoices}>
      <Demos
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
