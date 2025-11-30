import { Fragment, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter' // for ui-default theme-breezy
import './lib/root.css'
import './lib/tailwind.css'
import './lib/ui-default.css'
import './lib/light.css'
import './lib/dark.css'
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
                <SlMenuItem value="js"><SlIcon slot="prefix"></SlIcon>Vanilla JS</SlMenuItem>
              </a>
            </SlMenu>
          </SlDropdown>
          <SlRadioGroup label="Theme" value="1" size='small' className='margin-right'>
            <SlRadioButton value="1">Monarch</SlRadioButton>
            <SlRadioButton value="2">Forma</SlRadioButton>
            <SlRadioButton value="3">Breezy</SlRadioButton>
            <SlRadioButton value="4">Pulse</SlRadioButton>
            <SlRadioButton value="5">Classic</SlRadioButton>
          </SlRadioGroup>
          <SlRadioGroup label="UI" value="1" size='small' className='margin-right'>
            <SlRadioButton value="1">Default</SlRadioButton>
            <SlRadioButton value="2">Shadcn</SlRadioButton>
            <SlRadioButton value="3">MUI</SlRadioButton>
          </SlRadioGroup>
          <SlRadioGroup label="Mode" value="1" size='small' className='margin-right'>
            <SlRadioButton value="1">Dev</SlRadioButton>
            <a href='https://google.com'>
              <SlRadioButton value="2">Compiled</SlRadioButton>
            </a>
            <SlRadioButton value="3">Prod</SlRadioButton>
          </SlRadioGroup>
        </div>
        <div className='section'>
          <SlSelect placeholder="Select one" size='small'>
            <div style={{ width: 15, height: 15, background: 'red' }} slot="prefix"></div>
            <SlOption value="option-1"><div style={{ width: 15, height: 15, background: 'red' }} slot="prefix"></div>Option 1</SlOption>
            <SlOption value="option-2"><div style={{ width: 15, height: 15, background: 'red' }} slot="prefix"></div>Option 2</SlOption>
            <SlOption value="option-3"><div style={{ width: 15, height: 15, background: 'red' }} slot="prefix"></div>Option 3</SlOption>
          </SlSelect>
          <SlRadioGroup value="1" size='small'>
            <SlRadioButton value="1"><SlIcon slot="prefix" name="brightness-high" label='Light'></SlIcon></SlRadioButton>
            <SlRadioButton value="2"><SlIcon slot="prefix" name="moon" label='dark'></SlIcon></SlRadioButton>
          </SlRadioGroup>
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
