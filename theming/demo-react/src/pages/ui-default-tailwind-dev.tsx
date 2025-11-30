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
import SlIcon from '@shoelace-style/shoelace/dist/react/icon/index.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
import { ShadowRoot } from './lib/ShadowRoot.js'
import toolbarCssText from './lib/toolbar-shadow-root.css?inline'

setBasePath(`${import.meta.env.BASE_URL}shoelace`);

function App() {
  return (
    <Fragment>
      <ShadowRoot className='topbar' cssText={toolbarCssText}>
        <div className='section'>
          <SlDropdown>
            <SlButton variant='text' slot="trigger" caret>React</SlButton>
            <SlMenu>
              <SlMenuItem value="react"><SlIcon slot="prefix" name="check2"></SlIcon>React</SlMenuItem>
              <a href='https://google.com'>
                <SlMenuItem value="js"><SlIcon slot="prefix"></SlIcon>Vanilla</SlMenuItem>
              </a>
            </SlMenu>
          </SlDropdown>
          <SlRadioGroup label="Theme" name="a" value="1">
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
        <div className='section'>
          <SlDropdown>
            <SlButton variant='text' slot="trigger" caret>React</SlButton>
            <SlMenu>
              <SlMenuItem value="react"><SlIcon slot="prefix" name="check2"></SlIcon>React</SlMenuItem>
              <a href='https://google.com'>
                <SlMenuItem value="js"><SlIcon slot="prefix"></SlIcon>Vanilla</SlMenuItem>
              </a>
            </SlMenu>
          </SlDropdown>
          <SlRadioGroup label="Theme" name="a" value="1">
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
