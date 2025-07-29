/*
TODO:
Dark-mode for default component lib
Hook up MUI border (for dark mode)
How to do MUI *OUTER* border? not rely on Shadcn border
Program nice default event color. Don't use custom colors. Don't use background events
The purple MUI theme should be give "paper" bg color on the calendars because body bg is grey
Make classic theme colors more accurate to original

Later:
(common color interface for all themes?)
Somehow do not put Shadcn reset (which does border) on whole document?
Radix warnings about controlled vs uncontrolled

When Shadcn is not the selected component lib, change Shadcn palette (for topbar) to default
*/

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
import adaptivePlugin from '@fullcalendar/adaptive'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'
import interactionPlugin from '@fullcalendar/interaction'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'

// FullCalendar Default UI
import { EventCalendar as FcMonarchEventCalendar } from '@fullcalendar/ui-default-react/theme-monarch/EventCalendar' // gen!
import { Scheduler as FcMonarchScheduler } from '@fullcalendar/ui-default-react/theme-monarch/Scheduler' // gen!
import { EventCalendar as FcPulseEventCalendar } from '@fullcalendar/ui-default-react/theme-pulse/EventCalendar'
import { Scheduler as FcPulseScheduler } from '@fullcalendar/ui-default-react/theme-pulse/Scheduler'
import { EventCalendar as FcFormaEventCalendar } from '@fullcalendar/ui-default-react/theme-forma/EventCalendar'
import { Scheduler as FcFormaScheduler } from '@fullcalendar/ui-default-react/theme-forma/Scheduler'
import { EventCalendar as FcClassicEventCalendar } from '@fullcalendar/ui-default-react/theme-classic/EventCalendar'
import { Scheduler as FcClassicScheduler } from '@fullcalendar/ui-default-react/theme-classic/Scheduler'
import { EventCalendar as FcBreezyEventCalendar } from '@fullcalendar/ui-default-react/theme-breezy/EventCalendar'
import { Scheduler as FcBreezyScheduler } from '@fullcalendar/ui-default-react/theme-breezy/Scheduler'

// Shadcn
import { EventCalendar as ShadcnMonarchEventCalendar } from '@fullcalendar/shadcn/theme-monarch/EventCalendar'
import { Scheduler as ShadcnMonarchScheduler } from '@fullcalendar/shadcn/theme-monarch/Scheduler'
import { EventCalendar as ShadcnPulseEventCalendar } from '@fullcalendar/shadcn/theme-pulse/EventCalendar'
import { Scheduler as ShadcnPulseScheduler } from '@fullcalendar/shadcn/theme-pulse/Scheduler'
import { EventCalendar as ShadcnFormaEventCalendar } from '@fullcalendar/shadcn/theme-forma/EventCalendar'
import { Scheduler as ShadcnFormaScheduler } from '@fullcalendar/shadcn/theme-forma/Scheduler'
import { EventCalendar as ShadcnClassicEventCalendar } from '@fullcalendar/shadcn/theme-classic/EventCalendar'
import { Scheduler as ShadcnClassicScheduler } from '@fullcalendar/shadcn/theme-classic/Scheduler'
import { EventCalendar as ShadcnBreezyEventCalendar } from '@fullcalendar/shadcn/theme-breezy/EventCalendar'
import { Scheduler as ShadcnBreezyScheduler } from '@fullcalendar/shadcn/theme-breezy/Scheduler'

// MUI
import MuiMonarchEventCalendar from '@fullcalendar/mui-material/theme-monarch/EventCalendar'
import MuiMonarchScheduler from '@fullcalendar/mui-material/theme-monarch/Scheduler'
import { EventCalendar as MuiPulseEventCalendar } from '@fullcalendar/mui-material/theme-pulse/EventCalendar'
import { Scheduler as MuiPulseScheduler } from '@fullcalendar/mui-material/theme-pulse/Scheduler'
import MuiFormaEventCalendar from '@fullcalendar/mui-material/theme-forma/EventCalendar'
import MuiFormaScheduler from '@fullcalendar/mui-material/theme-forma/Scheduler'
import { EventCalendar as MuiClassicEventCalendar } from '@fullcalendar/mui-material/theme-classic/EventCalendar'
import { Scheduler as MuiClassicScheduler } from '@fullcalendar/mui-material/theme-classic/Scheduler'
import MuiBreezyEventCalendar from '@fullcalendar/mui-material/theme-breezy/EventCalendar'
import MuiBreezyScheduler from '@fullcalendar/mui-material/theme-breezy/Scheduler'

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import MuiCssBaseline from '@mui/material/CssBaseline'
import { getMuiTheme } from './palettes-mui-material.js'

type CalendarComponentProps = CalendarOptions & { availableViews: string[] }
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
    monarch: MuiMonarchEventCalendar,
    pulse: MuiPulseEventCalendar,
    forma: MuiFormaEventCalendar,
    classic: MuiClassicEventCalendar,
    breezy: MuiBreezyEventCalendar,
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
    monarch: MuiMonarchScheduler,
    pulse: MuiPulseScheduler,
    forma: MuiFormaScheduler,
    classic: MuiClassicScheduler,
    breezy: MuiBreezyScheduler,
  },
}

const uiOptions = [
  { value: 'fc', text: 'Default' },
  { value: 'shadcn', text: 'Shadcn' },
  { value: 'mui', text: 'MUI' },
]
const themeOptions = [
  { value: 'classic', text: 'Classic' },
  { value: 'monarch', text: 'Monarch' },
  { value: 'forma', text: 'Forma' },
  { value: 'breezy', text: 'Breezy' },
  { value: 'pulse', text: 'Pulse' },
]

const fcMonarchPaletteOptions = [
  { value: 'purple', text: 'Purple', colorClassName: 'bg-[#6750A4] dark:bg-[#D0BCFF]' },
  { value: 'red', text: 'Red', colorClassName: 'bg-[rgb(143_76_56)] dark:bg-[rgb(255_181_160)]' },
  { value: 'green', text: 'Green', colorClassName: 'bg-[rgb(76_102_43)] dark:bg-[rgb(177_209_138)]' },
  { value: 'blue', text: 'Blue', colorClassName: 'bg-[rgb(65_95_145)] dark:bg-[rgb(170_199_255)]' },
  { value: 'yellow', text: 'Yellow', colorClassName: 'bg-[rgb(109_94_15)] dark:bg-[rgb(219_198_110)]' },
]
const fcFormaPaletteOptions = [ // TODO: dark colors
  { value: 'blue', text: 'Blue', colorClassName: 'bg-[#0F6CBD]' },
  { value: 'red', text: 'Red', colorClassName: 'bg-[#d83b01]' },
  { value: 'green', text: 'Green', colorClassName: 'bg-[#107c41]' },
  { value: 'purple', text: 'Purple', colorClassName: 'bg-[#742774]' },
]
const fcPulsePaletteOptions = [ // TODO: dark colors
  { value: 'red', text: 'Red', colorClassName: 'bg-[#fd453b]' },
  { value: 'blue', text: 'Blue', colorClassName: 'bg-[#117aff]' },
  { value: 'purple', text: 'Purple', colorClassName: 'bg-[#ad46ff]' },
  { value: 'green', text: 'Green', colorClassName: 'bg-[#34c759]' },
]
const fcBreezyPaletteOptions = [ // TODO: dark colors
  { value: 'indigo', text: 'Indigo', colorClassName: 'bg-indigo-600' },
  { value: 'rose', text: 'Rose', colorClassName: 'bg-rose-600' },
  { value: 'emerald', text: 'Emerald', colorClassName: 'bg-emerald-600' },
  { value: 'honey', text: 'Honey', colorClassName: 'bg-yellow-500' },
]

const shadcnPaletteOptions = [
  { value: 'default', text: 'Default', colorClassName: 'bg-black dark:bg-white' },
  { value: 'red', text: 'Red', colorClassName: 'bg-[oklch(0.577_0.245_27.325)] dark:bg-[oklch(0.637_0.237_25.331)]' },
  { value: 'rose', text: 'Rose', colorClassName: 'bg-[oklch(0.586_0.253_17.585)] dark:bg-[oklch(0.645_0.246_16.439)]' },
  { value: 'orange', text: 'Orange', colorClassName: 'bg-[oklch(0.646_0.222_41.116)] dark:bg-[oklch(0.705_0.213_47.604))]' },
  { value: 'green', text: 'Green', colorClassName: 'bg-[oklch(0.648_0.2_131.684)] dark:bg-[oklch(0.648_0.2_131.684)]' },
  { value: 'blue', text: 'Blue', colorClassName: 'bg-[oklch(0.546_0.245_262.881)] dark:bg-[oklch(0.623_0.214_259.815)]' },
  { value: 'yellow', text: 'Yellow', colorClassName: 'bg-[oklch(0.852_0.199_91.936)] dark:bg-[oklch(0.795_0.184_86.047)]' },
  { value: 'violet', text: 'Violet', colorClassName: 'bg-[oklch(0.541_0.281_293.009)] dark:bg-[oklch(0.606_0.25_292.717)]' },
]
const muiPaletteOptions = [
  { value: 'blue', text: 'Blue', colorClassName: 'bg-[rgb(25,118,210)] dark:bg-[rgb(144,202,249)]' },
  { value: 'purple', text: 'Purple', colorClassName: 'bg-[#6200ea] dark:bg-[#bb86fc]' }
]
const colorSchemeOptions = [
  { value: 'light', text: 'Light' },
  { value: 'dark', text: 'Dark' },
]

const uiValues = uiOptions.map((option) => option.value)
const themeOptionValues = themeOptions.map((option) => option.value)

const fcMonarchPaletteValues = fcMonarchPaletteOptions.map((option) => option.value)
const fcFormaPaletteValues = fcFormaPaletteOptions.map((option) => option.value)
const fcBreezyPaletteValues = fcBreezyPaletteOptions.map((option) => option.value)
const fcPulsePaletteValues = fcPulsePaletteOptions.map((option) => option.value)

const shadcnPaletteValues = shadcnPaletteOptions.map((option) => option.value)
const muiPaletteValues = muiPaletteOptions.map((option) => option.value)
const colorSchemeValues = colorSchemeOptions.map((option) => option.value) as ('light' | 'dark')[]

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

    rootEl.setAttribute('data-theme', theme)
    rootEl.setAttribute('data-palette', fcPalette)
    rootEl.setAttribute('data-shadcn-palette', shadcnPalette)
    rootEl.setAttribute('data-color-scheme', colorScheme)
  }, [ui, theme, fcMonarchPalette, fcFormaPalette, fcBreezyPalette, fcPulsePalette, shadcnPalette, colorScheme])

  return (
    <>
      <div className='topbar sticky z-10 top-0 p-4 border-b bg-background shadow-xs flex flex-row gap-8 justify-between'>
        <div className='flex flex-row gap-8'>
          <div className='flex flex-row items-center gap-4'>
            <div className='text-sm text-muted-foreground'>Theme</div>
            <Tabs value={theme} onValueChange={(v) => setTheme(v)}>
              <TabsList>
                {themeOptions.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>{option.text}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className='flex flex-row items-center gap-4'>
            <div className='text-sm text-muted-foreground'>Component Lib</div>
            <Tabs value={ui} onValueChange={(v) => setUi(v)}>
              <TabsList>
                {uiOptions.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>{option.text}</TabsTrigger>
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
                  {shadcnPaletteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className='flex flex-row'>
                      <div key={option.value} className={`w-4 h-4 ${option.colorClassName}`} />
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
                  {muiPaletteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className='flex flex-row'>
                      <div className={`w-4 h-4 ${option.colorClassName}`} />
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
                  {fcMonarchPaletteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className='flex flex-row'>
                      <div className={`w-4 h-4 ${option.colorClassName}`} />
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
                  {fcFormaPaletteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className='flex flex-row'>
                      <div className={`w-4 h-4 ${option.colorClassName}`} />
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
                  {fcBreezyPaletteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className='flex flex-row'>
                      <div className={`w-4 h-4 ${option.colorClassName}`} />
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
                  {fcPulsePaletteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className='flex flex-row'>
                      <div className={`w-4 h-4 ${option.colorClassName}`} />
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Tabs value={colorScheme} onValueChange={(v) => setColorScheme(v as ('light' | 'dark'))}>
            <TabsList>
              {colorSchemeOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>{option.text}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div
        className={
          'flex-grow relative z-0 ' // +
          // (theme === 'pulse' ? 'bg-[#F8FAFB]' : '')
        }
      >
        <MuiThemeProvider theme={muiTheme}>
          <div className='my-30 max-w-[1100px] mx-auto flex flex-col gap-30'>
            {(ui === 'mui') && (
              <MuiCssBaseline />
            )}
            <EventCalendarDemo
              initialView='timeGridWeek'
              ui={ui}
              theme={theme}
            />
            <EventCalendarDemo
              initialView='dayGridMonth'
              ui={ui}
              theme={theme}
            />
            <SchedulerDemo
              initialView='resourceTimelineWeek'
              ui={ui}
              theme={theme}
            />
          </div>
        </MuiThemeProvider>
      </div>
    </>
  )
}

interface DemoProps {
  ui: string
  theme: string
  initialView?: string
}

const eventCalendarAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]

function EventCalendarDemo(props: DemoProps) {
  const EventCalendarComponent = eventCalendarComponentMap[props.ui][props.theme]

  return (
    <EventCalendarComponent
      availableViews={eventCalendarAvailableViews} // required! should be based on plugins!?
      navLinkDayClick='timeGridDay'
      navLinkWeekClick='timeGridWeek'
      schedulerLicenseKey='CC-Attribution-NonCommercial-NoDerivatives'
      weekNumbers={true}
      // eventDisplay='block'
      plugins={[
        // won't need to supply these with the gen!
        scrollGridPlugin,
        adaptivePlugin,
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin,
        multiMonthPlugin,
      ]}
      eventInteractive={true}
      initialView={props.initialView ?? eventCalendarAvailableViews[0]}
      nowIndicator={true}
      navLinks={true}
      editable={true}
      selectable={true}
      selectMirror={false}
      dayMaxEvents={true}
      // businessHours={true} // -- TODO: background conflicts with the week number pills!!!
      // eventMaxStack={1}
      {...( // NOTE: if we gave undefined for either of these settings, calendar render NO day header!
        props.theme === 'monarch'
          ? {
            listDayFormat: { day: 'numeric' },
            listDaySideFormat: { month: 'short', weekday: 'short', forceCommas: true },
          }
          : props.theme === 'breezy'
            ? {
              listDayFormat: { month: 'short', weekday: 'short', day: 'numeric' },
              listDaySideFormat: false,
            }
            : {} // default is for standard theme... which does side-format... kill this default
                  // and have standard theme set it?
      )}
      views={{
        dayGridMonth:
          props.theme === 'forma'
            ? { dayHeaderFormat: { weekday: 'long' } }
            : {},
        timeGrid:
          props.theme === 'monarch'
            ? { slotDuration: '01:00' }
            : {}
      }}
      // events='https://fullcalendar.io/api/demo-feeds/events.json?overload-day'
      now='2025-07-04T12:00:00'
      events={[
        {
          "title": "All Day Event",
          "start": "2025-07-01"
        },
        {
          "title": "Long Event",
          "start": "2025-07-07",
          "end": "2025-07-17",
          // "color": "var(--color-pink-500)",
        },
        {
          "groupId": "999",
          "title": "Repeating Event",
          "start": "2025-07-09T16:00:00+00:00"
        },
        {
          "groupId": "999",
          "title": "Repeating Event",
          "start": "2025-07-16T16:00:00+00:00"
        },
        {
          "title": "Conference",
          "start": "2025-07-03",
          "end": "2025-07-05"
        },
        {
          "title": "Meeting",
          "start": "2025-07-04T10:30:00+00:00",
          "end": "2025-07-04T12:30:00+00:00"
        },
        {
          "title": "Lunch",
          "start": "2025-07-04T12:00:00+00:00"
        },
        {
          "title": "Birthday Party",
          "start": "2025-07-05T07:00:00+00:00"
        },
        {
          "url": "http:\/\/google.com\/",
          "title": "Click for Google",
          "start": "2025-07-28"
        },
        {
          "title": "Meeting",
          "start": "2025-07-04T08:30:00+00:00",
          "end": "2025-07-04T16:30:00+00:00",
          "display": "background",
          // "color": "red",
        },
        {
          "title": "Happy Hour",
          "start": "2025-07-04T17:30:00+00:00"
        },
        {
          "title": "Dinner",
          "start": "2025-07-04T20:00:00+00:00"
        }
      ]}
    />
  )
}

const schedulerAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]

function SchedulerDemo(props: DemoProps) {
  const SchedulerComponent = schedulerComponentMap[props.ui][props.theme]

  return (
    <SchedulerComponent
      availableViews={schedulerAvailableViews}
      navLinkDayClick='resourceTimelineDay'
      navLinkWeekClick='resourceTimelineWeek'
      schedulerLicenseKey='CC-Attribution-NonCommercial-NoDerivatives'
      plugins={[
        // won't need to supply these with the gen!
        adaptivePlugin,
        timelinePlugin,
        resourceTimelinePlugin,
        resourceTimeGridPlugin,
        resourceDayGridPlugin,
        scrollGridPlugin,
        interactionPlugin,
        listPlugin, // needed for options!
        multiMonthPlugin, // needed for options!
      ]}
      initialView={schedulerAvailableViews[0]}
      timeZone='UTC'
      dayMinWidth={200}
      editable={true}
      selectable={true}
      nowIndicator={true}
      aspectRatio={1.6}
      scrollTime='07:00'
      views={{
        resourceTimelineThreeDays: {
          type: 'resourceTimeline',
          duration: { days: 3 },
        },
        resourceTimeline: {
          slotDuration: '01:00',
          snapDuration: '00:30',
        },
      }}
      resourceAreaHeaderContent='Rooms'
      resourceAreaWidth='40%'
      resourceGroupField='building'
      resourceAreaColumns={[
        { headerContent: 'Building', field: 'building' },
        { headerContent: 'Room', field: 'title' },
        { headerContent: 'Occupancy', field: 'occupancy' },
      ]}
      resources={[
        { id: 'a', building: '460 Bryant', title: 'Auditorium A', occupancy: 40 },
        { id: 'b', building: '460 Bryant', title: 'Auditorium B', occupancy: 40, eventColor: 'green' },
        { id: 'c', building: '460 Bryant', title: 'Auditorium C', occupancy: 40, eventColor: 'orange' },
        {
          id: 'd',
          building: '460 Bryant',
          title: 'Auditorium D',
          occupancy: 40,
          children: [
            { id: 'd1', title: 'Room D1', occupancy: 10 },
            { id: 'd2', title: 'Room D2', occupancy: 10 },
          ],
        },
        { id: 'e', building: '460 Bryant', title: 'Auditorium E', occupancy: 40 },
        { id: 'f', building: '460 Bryant', title: 'Auditorium F', occupancy: 40, eventColor: 'red' },
        { id: 'g', building: '564 Pacific', title: 'Auditorium G', occupancy: 40 },
        { id: 'h', building: '564 Pacific', title: 'Auditorium H', occupancy: 40 },
        { id: 'i', building: '564 Pacific', title: 'Auditorium I', occupancy: 40 },
        { id: 'j', building: '564 Pacific', title: 'Auditorium J', occupancy: 40 },
        { id: 'k', building: '564 Pacific', title: 'Auditorium K', occupancy: 40 },
        { id: 'l', building: '564 Pacific', title: 'Auditorium L', occupancy: 40 },
        { id: 'm', building: '564 Pacific', title: 'Auditorium M', occupancy: 40 },
        { id: 'n', building: '564 Pacific', title: 'Auditorium N', occupancy: 40 },
        { id: 'o', building: '564 Pacific', title: 'Auditorium O', occupancy: 40 },
        { id: 'p', building: '564 Pacific', title: 'Auditorium P', occupancy: 40 },
        { id: 'q', building: '564 Pacific', title: 'Auditorium Q', occupancy: 40 },
        { id: 'r', building: '564 Pacific', title: 'Auditorium R', occupancy: 40 },
        { id: 's', building: '564 Pacific', title: 'Auditorium S', occupancy: 40 },
        { id: 't', building: '564 Pacific', title: 'Auditorium T', occupancy: 40 },
        { id: 'u', building: '564 Pacific', title: 'Auditorium U', occupancy: 40 },
        { id: 'v', building: '564 Pacific', title: 'Auditorium V', occupancy: 40 },
        { id: 'w', building: '564 Pacific', title: 'Auditorium W', occupancy: 40 },
        { id: 'x', building: '564 Pacific', title: 'Auditorium X', occupancy: 40 },
        { id: 'y', building: '564 Pacific', title: 'Auditorium Y', occupancy: 40 },
        { id: 'z', building: '564 Pacific', title: 'Auditorium Z', occupancy: 40 },
      ]}
      events='https://fullcalendar.io/api/demo-feeds/events.json?single-day&for-resource-timeline'
    />
  )
}
