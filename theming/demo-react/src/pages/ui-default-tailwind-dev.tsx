import { Fragment, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { TopBar } from './lib/topbar.js'
import '@fontsource-variable/inter' // for ui-default theme-breezy
import './lib/root.css'
import './lib/tailwind.css'
import './lib/ui-default.css'

import '@shoelace-style/shoelace/dist/themes/light.css'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js'
import SlIcon from '@shoelace-style/shoelace/dist/react/icon/index.js'

setBasePath(`${import.meta.env.BASE_URL}shoelace`);

function App() {
  return (
    <Fragment>
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <SlButton>Some Button</SlButton>
        <SlIcon name='arrow-up-left-circle' style={{ width: 20, height: 20 }}></SlIcon>
      </div>
      {/* <TopBar ui='default' mode='dev' isPlugin={false} /> */}
      <div>hey</div>
    </Fragment>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
