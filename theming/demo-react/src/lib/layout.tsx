import { Fragment, ReactNode } from 'react'
import './root.css'
import './shoelace/theme-base.css'
import './shoelace/theme-dark.css'
import SlRadioButton from '@shoelace-style/shoelace/dist/react/radio-button/index.js'
import SlRadioGroup from '@shoelace-style/shoelace/dist/react/radio-group/index.js'
import SlOption from '@shoelace-style/shoelace/dist/react/option/index.js'
import SlSelect from '@shoelace-style/shoelace/dist/react/select/index.js'
import SlIcon from '@shoelace-style/shoelace/dist/react/icon/index.js'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
import { ShadowRoot } from './shadow-root.js'
import topbarCssText from './topbar-shadow-root.css?inline'
import { themeOptions, Mode, uiUrls, modeOptions, uiOptions, UIName } from './config.js'
import { DemoChoices } from './demo-choices.js'

const baseUrl = import.meta.env.BASE_URL
setBasePath(`${baseUrl}shoelace`)

export interface LayoutProps extends DemoChoices {
  ui: UIName
  mode: Mode
  children?: ReactNode
}

export function Layout(props: LayoutProps) {
  return (
    <Fragment>
      <ShadowRoot className='topbar' cssText={topbarCssText}>
        <div className='section'>
          {/*
            import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js'
            import SlDropdown from '@shoelace-style/shoelace/dist/react/dropdown/index.js'
            import SlMenu from '@shoelace-style/shoelace/dist/react/menu/index.js'
            import SlMenuItem from '@shoelace-style/shoelace/dist/react/menu-item/index.js'

            <SlDropdown>
              <SlButton variant='text' slot='trigger' caret>
                React
              </SlButton>
              <SlMenu>
                <SlMenuItem><SlIcon slot='prefix' name='check2'></SlIcon>React</SlMenuItem>
                <SlMenuItem><SlIcon slot='prefix' />Vue</SlMenuItem>
                <SlMenuItem><SlIcon slot='prefix' />Vanilla JS</SlMenuItem>
              </SlMenu>
            </SlDropdown>
          */}
          <SlRadioGroup
            label='Theme'
            value={props.theme}
            onSlChange={(ev) => props.setTheme((ev.currentTarget as any).value)}
            size='small'
          >
            {Object.entries(themeOptions).map(([themeOption, themeMeta]) => (
              <SlRadioButton key={themeOption} value={themeOption}>{themeMeta.text}</SlRadioButton>
            ))}
          </SlRadioGroup>
          <SlRadioGroup
            label='UI'
            value={props.ui}
            size='small'
          >
            {Object.entries(uiOptions).map(([uiOption, uiMeta]) => (
              <a key={uiOption} href={baseUrl + uiUrls[uiOption as UIName][props.mode]}>
                <SlRadioButton value={uiOption}>{uiMeta.text}</SlRadioButton>
              </a>
            ))}
          </SlRadioGroup>
          <SlRadioGroup
            label='Mode'
            value={props.mode}
            size='small'
          >
            {Object.entries(modeOptions).map(([modeOption, modeMeta]) => {
              const url = uiUrls[props.ui][modeOption as Mode]
              if (url !== undefined) {
                return (
                  <a
                    key={modeOption}
                    href={baseUrl + url}
                  >
                    <SlRadioButton value={modeOption}>{modeMeta.text}</SlRadioButton>
                  </a>
                )
              }
            })}
          </SlRadioGroup>
        </div>
        <div className='section'>
          {props.paletteOptions && (
            <SlSelect
              value={props.palette}
              onSlChange={(ev) => props.setPalette!((ev.currentTarget as any).value)}
              size='small'
              style={{ width: 200 }}
            >
              <div
                slot='prefix'
                className='color-square'
                style={{
                  backgroundColor: props.colorScheme === 'dark'
                    ? props.paletteOptions[props.palette!].darkColor
                    : props.paletteOptions[props.palette!].lightColor
                }}
              />
              {Object.entries(props.paletteOptions).map(([paletteOption, paletteMeta]) => (
                <SlOption key={paletteOption} value={paletteOption}>
                  <div
                    slot='prefix'
                    className='color-square'
                    style={{
                      backgroundColor: props.colorScheme === 'dark'
                        ? paletteMeta.darkColor
                        : paletteMeta.lightColor
                    }}
                  />
                  {paletteMeta.text}
                </SlOption>
              ))}
            </SlSelect>
          )}
          <SlRadioGroup
            value={props.colorScheme}
            onSlChange={(ev) => props.setColorScheme((ev.currentTarget as any).value)}
            size='small'
          >
            <SlRadioButton value='light'>
              <SlIcon slot="prefix" name="brightness-high" label='Light'></SlIcon>
            </SlRadioButton>
            <SlRadioButton value='dark'>
              <SlIcon slot="prefix" name="moon" label='dark'></SlIcon>
            </SlRadioButton>
          </SlRadioGroup>
        </div>
      </ShadowRoot>
      {props.children}
    </Fragment>
  )
}
