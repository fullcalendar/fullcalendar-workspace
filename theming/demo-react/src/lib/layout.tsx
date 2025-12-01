import { Fragment, ReactNode, useEffect } from 'react'
import './root.css'
import './shoelace/theme-base.css'
import './shoelace/theme-dark.css'
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
import { ShadowRoot } from './shadow-root.js'
import topbarCssText from './topbar-shadow-root.css?inline'
import { useLocalStorageState } from './hooks.js'
import { themeOptions, colorSchemeOptions, ColorScheme, Mode, uiUrls, vanillaUrls, modeOptions, uiOptions, UIName, ThemeName } from './config.js'
import { PaletteMetaMap } from '@fullcalendar/theme-common'
import { paletteMetaMap as fcMonarchPaletteOptions } from '@fullcalendar/theme-monarch-tailwind/ui-default-palettes-meta'
import { paletteMetaMap as fcFormaPaletteOptions } from '@fullcalendar/theme-forma-tailwind/ui-default-palettes-meta'
import { paletteMetaMap as fcPulsePaletteOptions } from '@fullcalendar/theme-pulse-tailwind/ui-default-palettes-meta'
import { paletteMetaMap as fcBreezyPaletteOptions } from '@fullcalendar/theme-breezy-tailwind/ui-default-palettes-meta'
import { demoPaletteMap as shadcnPaletteOptions } from '@fullcalendar/shadcn/demo-palettes-meta'
import { demoPaletteMap as muiPaletteOptions } from '@fullcalendar/ui-mui-tailwind/demo-palettes-meta'
import { EventCalendarProps } from '@fullcalendar/theme-common/event-calendar'
import { SchedulerProps } from '@fullcalendar/theme-common/scheduler'
import { Demos } from './demos.js'

setBasePath(`${import.meta.env.BASE_URL}shoelace`)

const themeOptionValues = Object.keys(themeOptions) as ThemeName[]
const fcMonarchPaletteValues = Object.keys(fcMonarchPaletteOptions)
const fcFormaPaletteValues = Object.keys(fcFormaPaletteOptions)
const fcBreezyPaletteValues = Object.keys(fcBreezyPaletteOptions)
const fcPulsePaletteValues = Object.keys(fcPulsePaletteOptions)
const shadcnPaletteValues = Object.keys(shadcnPaletteOptions)
const muiPaletteValues = Object.keys(muiPaletteOptions)
const colorSchemeValues = Object.keys(colorSchemeOptions) as ColorScheme[]

export interface LayoutProps {
  ui: UIName
  mode: Mode
  isVanilla?: boolean
  children?: ReactNode
  renderEventCalendar: (theme: ThemeName, props: EventCalendarProps) => ReactNode
  renderScheduler: (theme: ThemeName, props: SchedulerProps) => ReactNode
}

export function Layout(props: LayoutProps) {
  const [theme, setTheme] = useLocalStorageState('theme', themeOptionValues[0], themeOptionValues)
  const [fcMonarchPalette, setFcMonarchPalette] = useLocalStorageState('fcMonarchPalette', fcMonarchPaletteValues[0], fcMonarchPaletteValues)
  const [fcFormaPalette, setFcFormaPalette] = useLocalStorageState('fcFormaPalette', fcFormaPaletteValues[0], fcFormaPaletteValues)
  const [fcBreezyPalette, setFcBreezyPalette] = useLocalStorageState('fcBreezyPalette', fcBreezyPaletteValues[0], fcBreezyPaletteValues)
  const [fcPulsePalette, setFcPulsePalette] = useLocalStorageState('fcPulsePalette', fcPulsePaletteValues[0], fcPulsePaletteValues)
  const [shadcnPalette, setShadcnPalette] = useLocalStorageState('shadcnPalette', 'default', shadcnPaletteValues)
  const [muiPalette, setMuiPalette] = useLocalStorageState('muiPalette', 'blue', muiPaletteValues)
  const [colorScheme, setColorScheme] = useLocalStorageState('colorScheme', 'light', colorSchemeValues)

  let palette: string | undefined
  let setPalette: ((paletted: string) => void) | undefined
  let paletteOptions: PaletteMetaMap | undefined

  if (props.ui === 'shadcn') {
    palette = shadcnPalette
    setPalette = setShadcnPalette
    paletteOptions = shadcnPaletteOptions
  } else if (props.ui === 'mui') {
    palette = muiPalette
    setPalette = setMuiPalette
    paletteOptions = muiPaletteOptions
  } else { // props.ui === 'default'
    if (theme === 'monarch') {
      palette = fcMonarchPalette
      setPalette = setFcMonarchPalette
      paletteOptions = fcMonarchPaletteOptions
    } else if (theme === 'forma') {
      palette = fcFormaPalette
      setPalette = setFcFormaPalette
      paletteOptions = fcFormaPaletteOptions
    } else if (theme === 'breezy') {
      palette = fcBreezyPalette
      setPalette = setFcBreezyPalette
      paletteOptions = fcBreezyPaletteOptions
    } else if (theme === 'pulse') {
      palette = fcPulsePalette
      setPalette = setFcPulsePalette
      paletteOptions = fcPulsePaletteOptions
    }
  }

  useEffect(() => {
    const rootEl = document.documentElement
    rootEl.setAttribute('data-theme', theme)
    rootEl.setAttribute('data-palette', palette || '')
    rootEl.setAttribute('data-color-scheme', colorScheme)
  }, [theme, palette, colorScheme])

  return (
    <Fragment>
      <ShadowRoot className='topbar' cssText={topbarCssText}>
        <div className='section'>
          <SlDropdown>
            <SlButton variant='text' slot='trigger' caret>
              {props.isVanilla ? 'Vanilla JS' : 'React'}
            </SlButton>
            <SlMenu>
              {props.isVanilla ? (
                <a href={import.meta.env.BASE_URL + uiUrls.default[props.mode]}>
                  <SlMenuItem><SlIcon slot='prefix' />React</SlMenuItem>
                </a>
              ) : (
                <SlMenuItem><SlIcon slot='prefix' name='check2'></SlIcon>React</SlMenuItem>
              )}
              {props.isVanilla ? (
                <SlMenuItem><SlIcon slot='prefix' name='check2'></SlIcon>Vanilla JS</SlMenuItem>
              ) : (
                <a href={import.meta.env.BASE_URL + vanillaUrls[props.mode]}>
                  <SlMenuItem><SlIcon slot='prefix' />Vanilla JS</SlMenuItem>
                </a>
              )}
            </SlMenu>
          </SlDropdown>
          <SlRadioGroup
            label='Mode'
            value={props.mode}
            size='small'
            className='margin-right'
          >
            {Object.entries(modeOptions).map(([modeOption, modeMeta]) => (
              <a
                key={modeOption}
                href={
                  import.meta.env.BASE_URL +
                  (props.isVanilla ? vanillaUrls : uiUrls[props.ui])[modeOption as Mode]
                }
              >
                <SlRadioButton value={modeOption}>{modeMeta.text}</SlRadioButton>
              </a>
            ))}
          </SlRadioGroup>
          <SlRadioGroup
            label='Theme'
            value={theme}
            onSlChange={(ev) => setTheme((ev.currentTarget as any).value)}
            size='small'
            className='margin-right'
          >
            {Object.entries(themeOptions).map(([themeOption, themeMeta]) => (
              <SlRadioButton key={themeOption} value={themeOption}>{themeMeta.text}</SlRadioButton>
            ))}
          </SlRadioGroup>
          {!props.isVanilla && (
            <SlRadioGroup
              label='UI'
              value={props.ui}
              size='small'
              className='margin-right'
            >
              {Object.entries(uiOptions).map(([uiOption, uiMeta]) => (
                <a key={uiOption} href={import.meta.env.BASE_URL + uiUrls[uiOption as UIName][props.mode]}>
                  <SlRadioButton value={uiOption}>{uiMeta.text}</SlRadioButton>
                </a>
              ))}
            </SlRadioGroup>
          )}
        </div>
        <div className='section'>
          {Boolean(paletteOptions) && (
            <SlSelect
              value={palette}
              onSlChange={(ev) => setPalette!((ev.currentTarget as any).value)}
              size='small'
              style={{ width: 200 }}
            >
              <div
                slot='prefix'
                className='color-square'
                style={{
                  backgroundColor: colorScheme === 'dark'
                    ? paletteOptions![palette!].darkColor
                    : paletteOptions![palette!].lightColor
                }}
              />
              {Object.entries(paletteOptions!).map(([paletteOption, paletteMeta]) => (
                <SlOption key={paletteOption} value={paletteOption}>
                  <div
                    slot='prefix'
                    className='color-square'
                    style={{
                      backgroundColor: colorScheme === 'dark'
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
            value={colorScheme}
            onSlChange={(ev) => setColorScheme((ev.currentTarget as any).value)}
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
      <div className='demo-container'>
        {props.children}
        <Demos
          theme={theme}
          renderEventCalendar={props.renderEventCalendar}
          renderScheduler={props.renderScheduler}
        />
      </div>
    </Fragment>
  )
}
