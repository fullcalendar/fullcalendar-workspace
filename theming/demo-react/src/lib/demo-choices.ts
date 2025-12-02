import { useEffect } from 'react'
import { PaletteMetaMap } from '@fullcalendar/theme-common'
import { paletteMetaMap as fcMonarchPaletteOptions } from '@fullcalendar/theme-monarch-tailwind/ui-default-palettes-meta'
import { paletteMetaMap as fcFormaPaletteOptions } from '@fullcalendar/theme-forma-tailwind/ui-default-palettes-meta'
import { paletteMetaMap as fcPulsePaletteOptions } from '@fullcalendar/theme-pulse-tailwind/ui-default-palettes-meta'
import { paletteMetaMap as fcBreezyPaletteOptions } from '@fullcalendar/theme-breezy-tailwind/ui-default-palettes-meta'
import { demoPaletteMap as shadcnPaletteOptions } from '@fullcalendar/shadcn/demo-palettes-meta'
import { demoPaletteMap as muiPaletteOptions } from '@fullcalendar/ui-mui-tailwind/demo-palettes-meta'
import { themeOptions, colorSchemeOptions, ColorScheme, UIName, ThemeName } from './config.js'
import { useLocalStorageState } from './hooks.js'

const themeOptionValues = Object.keys(themeOptions) as ThemeName[]
const fcMonarchPaletteValues = Object.keys(fcMonarchPaletteOptions)
const fcFormaPaletteValues = Object.keys(fcFormaPaletteOptions)
const fcBreezyPaletteValues = Object.keys(fcBreezyPaletteOptions)
const fcPulsePaletteValues = Object.keys(fcPulsePaletteOptions)
const shadcnPaletteValues = Object.keys(shadcnPaletteOptions)
const muiPaletteValues = Object.keys(muiPaletteOptions)
const colorSchemeValues = Object.keys(colorSchemeOptions) as ColorScheme[]

export interface DemoChoices {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  palette: string
  paletteOptions: PaletteMetaMap | undefined
  setPalette: (paletted: string) => void
  colorScheme: ColorScheme
  setColorScheme: (colorScheme: ColorScheme) => void
}

export function useDemoChoices(ui: UIName): DemoChoices {
  const [theme, setTheme] = useLocalStorageState('theme', themeOptionValues[0], themeOptionValues)
  const [fcMonarchPalette, setFcMonarchPalette] = useLocalStorageState('fcMonarchPalette', fcMonarchPaletteValues[0], fcMonarchPaletteValues)
  const [fcFormaPalette, setFcFormaPalette] = useLocalStorageState('fcFormaPalette', fcFormaPaletteValues[0], fcFormaPaletteValues)
  const [fcBreezyPalette, setFcBreezyPalette] = useLocalStorageState('fcBreezyPalette', fcBreezyPaletteValues[0], fcBreezyPaletteValues)
  const [fcPulsePalette, setFcPulsePalette] = useLocalStorageState('fcPulsePalette', fcPulsePaletteValues[0], fcPulsePaletteValues)
  const [shadcnPalette, setShadcnPalette] = useLocalStorageState('shadcnPalette', 'default', shadcnPaletteValues)
  const [muiPalette, setMuiPalette] = useLocalStorageState('muiPalette', 'blue', muiPaletteValues)
  const [colorScheme, setColorScheme] = useLocalStorageState('colorScheme', 'light', colorSchemeValues)

  let palette: string | undefined
  let paletteOptions: PaletteMetaMap | undefined
  let setPalette: ((paletted: string) => void) | undefined

  if (ui === 'shadcn') {
    palette = shadcnPalette
    paletteOptions = shadcnPaletteOptions
    setPalette = setShadcnPalette
  } else if (ui === 'mui') {
    palette = muiPalette
    paletteOptions = muiPaletteOptions
    setPalette = setMuiPalette
  } else { // props.ui === 'default'
    if (theme === 'monarch') {
      palette = fcMonarchPalette
      paletteOptions = fcMonarchPaletteOptions
      setPalette = setFcMonarchPalette
    } else if (theme === 'forma') {
      palette = fcFormaPalette
      paletteOptions = fcFormaPaletteOptions
      setPalette = setFcFormaPalette
    } else if (theme === 'breezy') {
      palette = fcBreezyPalette
      paletteOptions = fcBreezyPaletteOptions
      setPalette = setFcBreezyPalette
    } else if (theme === 'pulse') {
      palette = fcPulsePalette
      paletteOptions = fcPulsePaletteOptions
      setPalette = setFcPulsePalette
    }
  }

  useEffect(() => {
    const rootEl = document.documentElement
    rootEl.setAttribute('data-theme', theme)
    rootEl.setAttribute('data-palette', palette || '')
    rootEl.setAttribute('data-color-scheme', colorScheme)
  }, [theme, palette, colorScheme])

  return {
    theme,
    setTheme,
    palette: palette || '',
    paletteOptions,
    setPalette: setPalette || (() => {}),
    colorScheme,
    setColorScheme,
  }
}
