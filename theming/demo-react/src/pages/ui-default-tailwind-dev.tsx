import { Fragment, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter' // for ui-default theme-breezy
import './lib/root.css'
import './lib/tailwind.css'
import './lib/ui-default.css'
import '@shoelace-style/shoelace/dist/themes/light.css'
import SlRadioButton from '@shoelace-style/shoelace/dist/react/radio-button/index.js'
import SlRadioGroup from '@shoelace-style/shoelace/dist/react/radio-group/index.js'
import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js';
import SlDropdown from '@shoelace-style/shoelace/dist/react/dropdown/index.js';
import SlMenu from '@shoelace-style/shoelace/dist/react/menu/index.js';
import SlMenuItem from '@shoelace-style/shoelace/dist/react/menu-item/index.js';
import SlOption from '@shoelace-style/shoelace/dist/react/option/index.js';
import SlSelect from '@shoelace-style/shoelace/dist/react/select/index.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
import { ShadowRoot } from './lib/ShadowRoot.js'

setBasePath(`${import.meta.env.BASE_URL}shoelace`);

function App() {
  return (
    <Fragment>
      <ShadowRoot
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: 4
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 4
          }}
        >
          <SlDropdown>
            <SlButton slot="trigger" caret>Edit</SlButton>
            <SlMenu>
              <SlMenuItem value="cut">Cut</SlMenuItem>
              <SlMenuItem value="copy">Copy</SlMenuItem>
              <SlMenuItem value="paste">Paste</SlMenuItem>
            </SlMenu>
          </SlDropdown>
          <SlRadioGroup name="a" value="1">
            <SlRadioButton value="1">Option 1</SlRadioButton>
            <SlRadioButton value="2">Option 2</SlRadioButton>
            <SlRadioButton value="3">Option 3</SlRadioButton>
          </SlRadioGroup>
          <SlSelect placeholder="Select one">
            <SlOption value="option-1">Option 1</SlOption>
            <SlOption value="option-2">Option 2</SlOption>
            <SlOption value="option-3">Option 3</SlOption>
          </SlSelect>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 4
          }}
        >
          <SlDropdown>
            <SlButton slot="trigger" caret>Edit</SlButton>
            <SlMenu>
              <SlMenuItem value="cut">Cut</SlMenuItem>
              <SlMenuItem value="copy">Copy</SlMenuItem>
              <SlMenuItem value="paste">Paste</SlMenuItem>
            </SlMenu>
          </SlDropdown>
          <SlRadioGroup name="a" value="1">
            <SlRadioButton value="1">Option 1</SlRadioButton>
            <SlRadioButton value="2">Option 2</SlRadioButton>
            <SlRadioButton value="3">Option 3</SlRadioButton>
          </SlRadioGroup>
          <SlSelect placeholder="Select one">
            <SlOption value="option-1">Option 1</SlOption>
            <SlOption value="option-2">Option 2</SlOption>
            <SlOption value="option-3">Option 3</SlOption>
          </SlSelect>
        </div>
      </ShadowRoot>
    </Fragment>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
