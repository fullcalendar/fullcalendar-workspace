
import './App.css'
import { useEffect, useMemo } from 'react'
import { useLocalStorageState } from './lib/hooks.js'

// Shadcn for this demo topbar
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.js'

// FullCalendar
import '@fullcalendar/core/global.css'
import { CalendarOptions } from '@fullcalendar/core'
// just for types...
import adaptivePlugin from '@fullcalendar/adaptive'
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timeline'
import {} from '@fullcalendar/resource-timegrid'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import {} from '@fullcalendar/timeline'

import { eventCalendarProps, eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import { resourceTimelineProps, vResourceProps } from '@fullcalendar/theme-common/scheduler'

import { paletteMetaMap as fcMonarchPaletteOptions } from '@fullcalendar/theme-monarch-tailwind/ui-default-palettes-meta'
import { paletteMetaMap as fcFormaPaletteOptions } from '@fullcalendar/theme-forma-tailwind/ui-default-palettes-meta'
import { paletteMetaMap as fcPulsePaletteOptions } from '@fullcalendar/theme-pulse-tailwind/ui-default-palettes-meta'
import { paletteMetaMap as fcBreezyPaletteOptions } from '@fullcalendar/theme-breezy-tailwind/ui-default-palettes-meta'

// FullCalendar Default UI
/* dev: */
import { EventCalendar as FcMonarchEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-monarch/event-calendar'
import { Scheduler as FcMonarchScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-monarch/scheduler'
import { EventCalendar as FcPulseEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-pulse/event-calendar'
import { Scheduler as FcPulseScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-pulse/scheduler'
import { EventCalendar as FcFormaEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-forma/event-calendar'
import { Scheduler as FcFormaScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-forma/scheduler'
import { EventCalendar as FcClassicEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-classic/event-calendar'
import { Scheduler as FcClassicScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-classic/scheduler'
import { EventCalendar as FcBreezyEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-breezy/event-calendar'
import { Scheduler as FcBreezyScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-breezy/scheduler'
/* prod:
import { EventCalendar as FcMonarchEventCalendar } from '@fullcalendar/ui-default-react-tailwind/gen/theme-monarch/event-calendar'
import { Scheduler as FcMonarchScheduler } from '@fullcalendar/ui-default-react-tailwind/gen/theme-monarch/scheduler'
import { EventCalendar as FcPulseEventCalendar } from '@fullcalendar/ui-default-react-tailwind/gen/theme-pulse/event-calendar'
import { Scheduler as FcPulseScheduler } from '@fullcalendar/ui-default-react-tailwind/gen/theme-pulse/scheduler'
import { EventCalendar as FcFormaEventCalendar } from '@fullcalendar/ui-default-react-tailwind/gen/theme-forma/event-calendar'
import { Scheduler as FcFormaScheduler } from '@fullcalendar/ui-default-react-tailwind/gen/theme-forma/scheduler'
import { EventCalendar as FcClassicEventCalendar } from '@fullcalendar/ui-default-react-tailwind/gen/theme-classic/event-calendar'
import { Scheduler as FcClassicScheduler } from '@fullcalendar/ui-default-react-tailwind/gen/theme-classic/scheduler'
import { EventCalendar as FcBreezyEventCalendar } from '@fullcalendar/ui-default-react-tailwind/gen/theme-breezy/event-calendar'
import { Scheduler as FcBreezyScheduler } from '@fullcalendar/ui-default-react-tailwind/gen/theme-breezy/scheduler'
*/

// Shadcn
/* dev: */
import { EventCalendar as ShadcnMonarchEventCalendar } from '@fullcalendar/ui-shadcn/theme-monarch/event-calendar'
import { Scheduler as ShadcnMonarchScheduler } from '@fullcalendar/ui-shadcn/theme-monarch/scheduler'
import { EventCalendar as ShadcnPulseEventCalendar } from '@fullcalendar/ui-shadcn/theme-pulse/event-calendar'
import { Scheduler as ShadcnPulseScheduler } from '@fullcalendar/ui-shadcn/theme-pulse/scheduler'
import { EventCalendar as ShadcnFormaEventCalendar } from '@fullcalendar/ui-shadcn/theme-forma/event-calendar'
import { Scheduler as ShadcnFormaScheduler } from '@fullcalendar/ui-shadcn/theme-forma/scheduler'
import { EventCalendar as ShadcnClassicEventCalendar } from '@fullcalendar/ui-shadcn/theme-classic/event-calendar'
import { Scheduler as ShadcnClassicScheduler } from '@fullcalendar/ui-shadcn/theme-classic/scheduler'
import { EventCalendar as ShadcnBreezyEventCalendar } from '@fullcalendar/ui-shadcn/theme-breezy/event-calendar'
import { Scheduler as ShadcnBreezyScheduler } from '@fullcalendar/ui-shadcn/theme-breezy/scheduler'
/* prod:
import { EventCalendar as ShadcnMonarchEventCalendar } from '@fullcalendar/ui-shadcn/gen/theme-monarch/event-calendar'
import { Scheduler as ShadcnMonarchScheduler } from '@fullcalendar/ui-shadcn/gen/theme-monarch/scheduler'
import { EventCalendar as ShadcnPulseEventCalendar } from '@fullcalendar/ui-shadcn/gen/theme-pulse/event-calendar'
import { Scheduler as ShadcnPulseScheduler } from '@fullcalendar/ui-shadcn/gen/theme-pulse/scheduler'
import { EventCalendar as ShadcnFormaEventCalendar } from '@fullcalendar/ui-shadcn/gen/theme-forma/event-calendar'
import { Scheduler as ShadcnFormaScheduler } from '@fullcalendar/ui-shadcn/gen/theme-forma/scheduler'
import { EventCalendar as ShadcnClassicEventCalendar } from '@fullcalendar/ui-shadcn/gen/theme-classic/event-calendar'
import { Scheduler as ShadcnClassicScheduler } from '@fullcalendar/ui-shadcn/gen/theme-classic/scheduler'
import { EventCalendar as ShadcnBreezyEventCalendar } from '@fullcalendar/ui-shadcn/gen/theme-breezy/event-calendar'
import { Scheduler as ShadcnBreezyScheduler } from '@fullcalendar/ui-shadcn/gen/theme-breezy/scheduler'
*/

// MUI
/* dev: */
import MuiMonarchEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-monarch/EventCalendar'
import MuiMonarchScheduler from '@fullcalendar/ui-mui-tailwind/theme-monarch/Scheduler'
import MuiPulseEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-pulse/EventCalendar'
import MuiPulseScheduler from '@fullcalendar/ui-mui-tailwind/theme-pulse/Scheduler'
import MuiFormaEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-forma/EventCalendar'
import MuiFormaScheduler from '@fullcalendar/ui-mui-tailwind/theme-forma/Scheduler'
import MuiClassicEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-classic/EventCalendar'
import MuiClassicScheduler from '@fullcalendar/ui-mui-tailwind/theme-classic/Scheduler'
import MuiBreezyEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-breezy/EventCalendar'
import MuiBreezyScheduler from '@fullcalendar/ui-mui-tailwind/theme-breezy/Scheduler'
/* prod:
import MuiMonarchEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-monarch/EventCalendar'
import MuiMonarchScheduler from '@fullcalendar/ui-mui-tailwind/theme-monarch/Scheduler'
import MuiPulseEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-pulse/EventCalendar'
import MuiPulseScheduler from '@fullcalendar/ui-mui-tailwind/theme-pulse/Scheduler'
import MuiFormaEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-forma/EventCalendar'
import MuiFormaScheduler from '@fullcalendar/ui-mui-tailwind/theme-forma/Scheduler'
import MuiClassicEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-classic/EventCalendar'
import MuiClassicScheduler from '@fullcalendar/ui-mui-tailwind/theme-classic/Scheduler'
import MuiBreezyEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-breezy/EventCalendar'
import MuiBreezyScheduler from '@fullcalendar/ui-mui-tailwind/theme-breezy/Scheduler'
*/

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import MuiCssBaseline from '@mui/material/CssBaseline'
import { getMuiTheme } from '@fullcalendar/ui-mui-tailwind/demo-palettes'

import { demoPaletteMap as shadcnPaletteOptions } from '@fullcalendar/shadcn/demo-palettes-meta'
import { demoPaletteMap as muiPaletteOptions } from '@fullcalendar/ui-mui-tailwind/demo-palettes-meta'

type CalendarComponentProps = CalendarOptions & {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}
type CalendarComponent = React.ComponentType<CalendarComponentProps>

const eventCalendarComponentMap: { [ui: string]: { [theme: string]: CalendarComponent } } = {
  fc: {
    monarch: FcMonarchEventCalendar,
    pulse: FcPulseEventCalendar,
    forma: FcFormaEventCalendar,
    classic: FcClassicEventCalendar,
    breezy: FcBreezyEventCalendar,
  },
  shadcn: {
    monarch: ShadcnMonarchEventCalendar,
    pulse: ShadcnPulseEventCalendar,
    forma: ShadcnFormaEventCalendar,
    classic: ShadcnClassicEventCalendar,
    breezy: ShadcnBreezyEventCalendar,
  },
  mui: {
    monarch: MuiMonarchEventCalendar as any, // HACK for className
    pulse: MuiPulseEventCalendar as any,
    forma: MuiFormaEventCalendar as any,
    classic: MuiClassicEventCalendar as any,
    breezy: MuiBreezyEventCalendar as any,
  },
}

const schedulerComponentMap: { [ui: string]: { [theme: string]: CalendarComponent } } = {
  fc: {
    monarch: FcMonarchScheduler,
    pulse: FcPulseScheduler,
    forma: FcFormaScheduler,
    classic: FcClassicScheduler,
    breezy: FcBreezyScheduler,
  },
  shadcn: {
    monarch: ShadcnMonarchScheduler,
    pulse: ShadcnPulseScheduler,
    forma: ShadcnFormaScheduler,
    classic: ShadcnClassicScheduler,
    breezy: ShadcnBreezyScheduler,
  },
  mui: {
    monarch: MuiMonarchScheduler as any, // HACK for className
    pulse: MuiPulseScheduler as any,
    forma: MuiFormaScheduler as any,
    classic: MuiClassicScheduler as any,
    breezy: MuiBreezyScheduler as any,
  },
}

const uiOptions = {
  fc: { text: 'Default' },
  shadcn: { text: 'Shadcn' },
  mui: { text: 'MUI' },
}

const themeOptions = {
  monarch: { text: 'Monarch' },
  forma: { text: 'Forma' },
  breezy: { text: 'Breezy' },
  pulse: { text: 'Pulse' },
  classic: { text: 'Classic' },
}

const colorSchemeOptions = {
  light: { text: 'Light' },
  dark: { text: 'Dark' },
}

const uiValues = Object.keys(uiOptions)
const themeOptionValues = Object.keys(themeOptions)

const fcMonarchPaletteValues = Object.keys(fcMonarchPaletteOptions)
const fcFormaPaletteValues = Object.keys(fcFormaPaletteOptions)
const fcBreezyPaletteValues = Object.keys(fcBreezyPaletteOptions)
const fcPulsePaletteValues = Object.keys(fcPulsePaletteOptions)

const shadcnPaletteValues = Object.keys(shadcnPaletteOptions)
const muiPaletteValues = Object.keys(muiPaletteOptions)
const colorSchemeValues = Object.keys(colorSchemeOptions) as ('light' | 'dark')[]

export default function App() {
  const [ui, setUi] = useLocalStorageState('ui', 'fc', uiValues)
  const [theme, setTheme] = useLocalStorageState('theme', 'monarch', themeOptionValues)
  const [fcMonarchPalette, setFcMonarchPalette] = useLocalStorageState('fcMonarchPalette', fcMonarchPaletteValues[0], fcMonarchPaletteValues)
  const [fcFormaPalette, setFcFormaPalette] = useLocalStorageState('fcFormaPalette', fcFormaPaletteValues[0], fcFormaPaletteValues)
  const [fcBreezyPalette, setFcBreezyPalette] = useLocalStorageState('fcBreezyPalette', fcBreezyPaletteValues[0], fcBreezyPaletteValues)
  const [fcPulsePalette, setFcPulsePalette] = useLocalStorageState('fcPulsePalette', fcPulsePaletteValues[0], fcPulsePaletteValues)
  const [shadcnPalette, setShadcnPalette] = useLocalStorageState('shadcnPalette', 'default', shadcnPaletteValues)
  const [muiPalette, setMuiPalette] = useLocalStorageState('muiPalette', 'blue', muiPaletteValues)
  const [colorScheme, setColorScheme] = useLocalStorageState<'light' | 'dark'>('colorScheme', 'light', colorSchemeValues)

  const muiTheme = useMemo(
    () => getMuiTheme(muiPalette, colorScheme),
    [muiPalette, colorScheme],
  )

  useEffect(() => {
    const rootEl = document.documentElement
    const fcPalette =
      theme === 'monarch' ? fcMonarchPalette :
        theme === 'forma' ? fcFormaPalette :
          theme === 'breezy' ? fcBreezyPalette :
            theme === 'pulse' ? fcPulsePalette : ''

    rootEl.setAttribute('data-ui', ui)
    rootEl.setAttribute('data-theme', theme)
    rootEl.setAttribute('data-palette', fcPalette)
    rootEl.setAttribute('data-shadcn-palette', shadcnPalette)
    rootEl.setAttribute('data-color-scheme', colorScheme)
  }, [ui, theme, fcMonarchPalette, fcFormaPalette, fcBreezyPalette, fcPulsePalette, shadcnPalette, colorScheme])

  const EventCalendarComponent = eventCalendarComponentMap[ui][theme]
  const SchedulerComponent = schedulerComponentMap[ui][theme]

  return (
    <>
      <div className='topbar sticky z-10 top-0 p-4 border-b bg-background shadow-xs flex flex-row flex-wrap gap-8 justify-between'>
        <div className='flex flex-row flex-wrap gap-8'>
          <div className='flex flex-row items-center gap-4'>
            <div className='text-sm text-muted-foreground'>Theme</div>
            <Tabs value={theme} onValueChange={(v) => setTheme(v)}>
              <TabsList>
                {Object.entries(themeOptions).map(([value, option]) => (
                  <TabsTrigger key={value} value={value}>{option.text}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className='flex flex-row items-center gap-4'>
            <div className='text-sm text-muted-foreground'>Component Lib</div>
            <Tabs value={ui} onValueChange={(v) => setUi(v)}>
              <TabsList>
                {Object.entries(uiOptions).map(([value, option]) => (
                  <TabsTrigger key={value} value={value}>{option.text}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className='flex flex-row gap-8'>
          {(ui === 'shadcn') ? (
            <div className='flex flex-row items-center gap-4'>
              <div className='text-sm text-muted-foreground'>Palette</div>
              <Select value={shadcnPalette} onValueChange={(v) => setShadcnPalette(v)}>
                <SelectTrigger className='w-50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(shadcnPaletteOptions).map(([value, option]) => (
                    <SelectItem key={value} value={value} className='flex flex-row'>
                      <div className="size-4" style={{ backgroundColor: colorScheme === 'dark' ? option.darkColor : option.lightColor }} />
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (ui === 'mui') ? (
            <div className='flex flex-row items-center gap-4'>
              <div className='text-sm text-muted-foreground'>Palette</div>
              <Select value={muiPalette} onValueChange={(v) => setMuiPalette(v)}>
                <SelectTrigger className='w-50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(muiPaletteOptions).map(([value, option]) => (
                    <SelectItem key={value} value={value} className='flex flex-row'>
                      <div className="size-4" style={{ backgroundColor: colorScheme === 'dark' ? option.darkColor : option.lightColor }} />
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (theme === 'monarch') ? (
            <div className='flex flex-row items-center gap-4'>
              <div className='text-sm text-muted-foreground'>Palette</div>
              <Select value={fcMonarchPalette} onValueChange={(v) => setFcMonarchPalette(v)}>
                <SelectTrigger className='w-50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fcMonarchPaletteOptions).map(([value, option]) => (
                    <SelectItem key={value} value={value} className='flex flex-row'>
                      <div className="size-4" style={{ backgroundColor: colorScheme === 'dark' ? option.darkColor : option.lightColor }} />
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (theme === 'forma') ? (
            <div className='flex flex-row items-center gap-4'>
              <div className='text-sm text-muted-foreground'>Palette</div>
              <Select value={fcFormaPalette} onValueChange={(v) => setFcFormaPalette(v)}>
                <SelectTrigger className='w-50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fcFormaPaletteOptions).map(([value, option]) => (
                    <SelectItem key={value} value={value} className='flex flex-row'>
                      <div className="size-4" style={{ backgroundColor: colorScheme === 'dark' ? option.darkColor : option.lightColor }} />
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (theme === 'breezy') ? (
            <div className='flex flex-row items-center gap-4'>
              <div className='text-sm text-muted-foreground'>Palette</div>
              <Select value={fcBreezyPalette} onValueChange={(v) => setFcBreezyPalette(v)}>
                <SelectTrigger className='w-50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fcBreezyPaletteOptions).map(([value, option]) => (
                    <SelectItem key={value} value={value} className='flex flex-row'>
                      <div className="size-4" style={{ backgroundColor: colorScheme === 'dark' ? option.darkColor : option.lightColor }} />
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (theme === 'pulse') && (
            <div className='flex flex-row items-center gap-4'>
              <div className='text-sm text-muted-foreground'>Palette</div>
              <Select value={fcPulsePalette} onValueChange={(v) => setFcPulsePalette(v)}>
                <SelectTrigger className='w-50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fcPulsePaletteOptions).map(([value, option]) => (
                    <SelectItem key={value} value={value} className='flex flex-row'>
                      <div className="size-4" style={{ backgroundColor: colorScheme === 'dark' ? option.darkColor : option.lightColor }} />
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Tabs value={colorScheme} onValueChange={(v) => setColorScheme(v as ('light' | 'dark'))}>
            <TabsList>
              {Object.entries(colorSchemeOptions).map(([value, option]) => (
                <TabsTrigger key={value} value={value}>{option.text}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div
        className={
          'grow relative z-0 ' // +
          // (theme === 'pulse' ? 'bg-[#F8FAFB]' : '')
        }
      >
        <MuiThemeProvider theme={muiTheme}>
          <div className='my-30 max-w-[1100px] mx-auto flex flex-col gap-30'>
            {(ui === 'mui') && (
              <MuiCssBaseline />
            )}
            <EventCalendarComponent
              {...eventCalendarProps}
              initialView='dayGridMonth'
              availableViews={['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek', 'multiMonthYear']}
              plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
            />
            <EventCalendarComponent
              {...eventCalendarProps}
              initialView='timeGridWeek'
              plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
            />
            <EventCalendarComponent
              {...eventCalendarProps}
              initialView='multiMonthYear'
              plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
            />
            <EventCalendarComponent
              {...eventCalendarProps}
              initialView='dayGridYear'
              availableViews={['dayGridYear']}
              plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
            />
            <EventCalendarComponent
              {...eventCalendarProps}
              initialView='listYear'
              availableViews={['listYear', 'listMonth', 'listWeek']}
              plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
              listText='' // displays nicer list-view-button text
            />
            <SchedulerComponent
              {...resourceTimelineProps}
              initialView='resourceTimelineThreeDay'
              availableViews={['resourceTimelineDay', 'resourceTimelineThreeDay', 'resourceTimelineWeek']}
            />
            <SchedulerComponent
              {...vResourceProps}
              initialView='resourceTimeGridFiveDay'
              availableViews={['resourceTimeGridDay', 'resourceTimeGridTwoDay', 'resourceTimeGridFiveDay', 'resourceTimeGridWeek']}
            />
          </div>
        </MuiThemeProvider>
      </div>
    </>
  )
}
