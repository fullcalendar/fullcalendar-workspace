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
*/

import './App.css'
import { useEffect, useMemo } from 'react'
import { cn } from './lib/utils.js'
import { useLocalStorageState } from './lib/hooks.js'

// ShadCN
import { Button } from '@/components/ui/button.js'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.js'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

// MUI
import MuiButton from '@mui/material/Button'
import MuiIconButton from '@mui/material/IconButton'
import MuiTabs from '@mui/material/Tabs'
import MuiTab from '@mui/material/Tab'
import MuiChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import MuiChevronRightIcon from '@mui/icons-material/ChevronRight'
import MuiTypography from '@mui/material/Typography'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import MuiCssBaseline from '@mui/material/CssBaseline'

// FullCalendar
import '@fullcalendar/core/global.css'
import FullCalendar, { useCalendarController } from '@fullcalendar/react'
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
import { ButtonStateMap, CalendarController, PluginDef } from '@fullcalendar/core'

// FullCalendar themes
// > Breezy
import breezyTailwindTheme from '@fullcalendar/theme-breezy/tailwind'
// > Classic
import classicTailwindTheme from '@fullcalendar/theme-classic/tailwind'
// > Monarch
import monarchTailwindTheme from '@fullcalendar/theme-monarch/tailwind'
import monarchShadcnTheme from '@fullcalendar/theme-monarch/shadcn'
import monarchMuiTheme from '@fullcalendar/theme-monarch/mui'
// > Forma
import formaTailwindTheme from '@fullcalendar/theme-forma/tailwind'
import formaShadcnTheme from '@fullcalendar/theme-forma/shadcn'
import formaMuiTheme from '@fullcalendar/theme-forma/mui'
// > Zen
import zenTailwindTheme from '@fullcalendar/theme-zen/tailwind'
import zenShadcnTheme from '@fullcalendar/theme-zen/shadcn'
import zenMuiTheme from '@fullcalendar/theme-zen/mui'

// utils for our example
import { getMuiTheme } from './mui-themes.js'

const themeOptions = [
  { value: 'classic', text: 'Classic' },
  { value: 'monarch', text: 'Monarch', tooltip: 'A Google/Material-inspired theme' },
  { value: 'forma', text: 'Forma', tooltip: 'An Outlook Calendar-inspired theme' },
  { value: 'breezy', text: 'Breezy', tooltip: 'Windy theme' },
  // { value: 'zen', text: 'Zen', tooltip: 'A minimalist Apple-like theme' },
]
const componentLibOptions = [
  { value: 'fc', text: 'Default' },
  { value: 'shadcn', text: 'Shadcn' },
  { value: 'mui', text: 'MUI' },
]
const fcMonarchPaletteOptions = [
  { value: 'purple', text: 'Purple', colorClassName: 'bg-[#6750A4] dark:bg-[#D0BCFF]' },
  { value: 'red', text: 'Red', colorClassName: 'bg-[rgb(143_76_56)] dark:bg-[rgb(255_181_160)]' },
  { value: 'green', text: 'Green', colorClassName: 'bg-[rgb(76_102_43)] dark:bg-[rgb(177_209_138)]' },
  { value: 'blue', text: 'Blue', colorClassName: 'bg-[rgb(65_95_145)] dark:bg-[rgb(170_199_255)]' },
  { value: 'yellow', text: 'Yellow', colorClassName: 'bg-[rgb(109_94_15)] dark:bg-[rgb(219_198_110)]' },
]
const fcFormaPaletteOptions = [
  { value: 'red', text: 'Red!', colorClassName: 'bg-red-500' },
  { value: 'black', text: 'Black!', colorClassName: 'bg-black' },
]
const fcZenPaletteOptions = [
  { value: 'green', text: 'Green!', colorClassName: 'bg-green-500' },
  { value: 'black', text: 'Black!', colorClassName: 'bg-black' },
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

const themeOptionValues = themeOptions.map((option) => option.value)
const componentLibValues = componentLibOptions.map((option) => option.value)
const fcMonarchPaletteValues = fcMonarchPaletteOptions.map((option) => option.value)
const fcFormaPaletteValues = fcFormaPaletteOptions.map((option) => option.value)
const fcZenPaletteValues = fcZenPaletteOptions.map((option) => option.value)
const shadcnPaletteValues = shadcnPaletteOptions.map((option) => option.value)
const muiPaletteValues = muiPaletteOptions.map((option) => option.value)
const colorSchemeValues = colorSchemeOptions.map((option) => option.value) as ('light' | 'dark')[]

const themePluginMap = {
  classic: {
    fc: classicTailwindTheme,
    shadcn: classicTailwindTheme, // dup
    mui: classicTailwindTheme, // dup
  },
  breezy: {
    fc: breezyTailwindTheme,
    shadcn: breezyTailwindTheme, // dup
    mui: breezyTailwindTheme, // dup
  },
  monarch: {
    fc: monarchTailwindTheme,
    shadcn: monarchShadcnTheme,
    mui: monarchMuiTheme,
  },
  forma: {
    fc: formaTailwindTheme,
    shadcn: formaShadcnTheme,
    mui: formaMuiTheme,
  },
  zen: {
    fc: zenTailwindTheme,
    shadcn: zenShadcnTheme,
    mui: zenMuiTheme,
  },
}

function buildFcRootClassName(theme: string, palette: string, colorScheme: string): string {
  return `fc-${theme} fc-${theme}-${palette} fc-${theme}-${palette}-${colorScheme}`
}

function buildShadcnRootClassName(palette: string, colorScheme: string): string {
  return `shadcn shadcn-${palette} shadcn-${palette}-${colorScheme}`
}

export default function App() {
  const [theme, setTheme] = useLocalStorageState('theme', 'monarch', themeOptionValues)
  const [componentLib, setComponentLib] = useLocalStorageState('componentLib', 'fc', componentLibValues)
  const [fcMonarchPalette, setFcMonarchPalette] = useLocalStorageState('fcMonarchPalette', fcMonarchPaletteValues[0], fcMonarchPaletteValues)
  const [fcFormaPalette, setFcFormaPalette] = useLocalStorageState('fcFormaPalette', fcFormaPaletteValues[0], fcFormaPaletteValues)
  const [fcZenPalette, setFcZenPalette] = useLocalStorageState('fcZenPalette', fcZenPaletteValues[0], fcZenPaletteValues)
  const [shadcnPalette, setShadcnPalette] = useLocalStorageState('shadcnPalette', 'default', shadcnPaletteValues)
  const [muiPalette, setMuiPalette] = useLocalStorageState('muiPalette', 'blue', muiPaletteValues)
  const [colorScheme, setColorScheme] = useLocalStorageState<'light' | 'dark'>('colorScheme', 'light', colorSchemeValues)

  const exampleClassName =
    theme === 'monarch' ? (
      componentLib === 'shadcn' ? 'border rounded-xl' :
        componentLib === 'mui' ? 'border rounded-lg' : ''
    ) : ''

  const ToolbarComponent =
    componentLib === 'shadcn' ? ShadcnToolbar :
      componentLib === 'mui' ? MuiToolbar : undefined

  const borderless = theme === 'monarch' && componentLib !== 'fc'

  const themePlugin = (themePluginMap as any)[theme]?.[componentLib] || monarchTailwindTheme

  const muiTheme = useMemo(
    () => getMuiTheme(muiPalette, colorScheme),
    [muiPalette, colorScheme],
  )

  useEffect(() => {
    document.documentElement.className = cn(
      colorScheme, // for tailwind dark:
      componentLib === 'shadcn'
        ? buildShadcnRootClassName(shadcnPalette, colorScheme)
        : cn(
          buildShadcnRootClassName('default', colorScheme), // for the topbar
          buildFcRootClassName(
            theme,
            theme === 'monarch' ? fcMonarchPalette :
              theme === 'forma' ? fcFormaPalette :
                theme === 'zen' ? fcZenPalette : '',
            colorScheme,
          )
        )
    )
  }, [componentLib, theme, fcMonarchPalette, fcFormaPalette, fcZenPalette, shadcnPalette, colorScheme])

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
            <Tabs value={componentLib} onValueChange={(v) => setComponentLib(v)}>
              <TabsList>
                {componentLibOptions.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>{option.text}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className='flex flex-row gap-8'>
          {(componentLib === 'shadcn') ? (
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
          ) : (componentLib === 'mui') ? (
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
          ) : (theme === 'zen') && (
            <div className='flex flex-row items-center gap-4'>
              <div className='text-sm text-muted-foreground'>Palette</div>
              <Select value={fcZenPalette} onValueChange={(v) => setFcZenPalette(v)}>
                <SelectTrigger className='w-50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fcZenPaletteOptions.map((option) => (
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
        className='flex-grow relative z-0'
        style={muiTheme.cssVariables ? {} : {
          '--mui-palette-primary-main': muiTheme.palette.primary.main,
          '--mui-palette-primary-light': muiTheme.palette.primary.light,
          '--mui-palette-primary-dark': muiTheme.palette.primary.dark,
          '--mui-palette-primary-contrastText': muiTheme.palette.primary.contrastText,
          '--mui-palette-secondary-main': muiTheme.palette.secondary.main,
          '--mui-palette-secondary-light': muiTheme.palette.secondary.light,
          '--mui-palette-secondary-dark': muiTheme.palette.secondary.dark,
          '--mui-palette-secondary-contrastText': muiTheme.palette.secondary.contrastText,
          '--mui-palette-success-main': muiTheme.palette.success.main,
          '--mui-palette-success-light': muiTheme.palette.success.light,
          '--mui-palette-success-dark': muiTheme.palette.success.dark,
          '--mui-palette-success-contrastText': muiTheme.palette.success.contrastText,
          '--mui-palette-action-disabledBackground': muiTheme.palette.action.disabledBackground,
          '--mui-palette-action-disabled': muiTheme.palette.action.disabled,
          '--mui-palette-divider': muiTheme.palette.divider,
          '--mui-palette-error-main': muiTheme.palette.error.main
        } as any}
      >
        <MuiThemeProvider theme={muiTheme}>
          <div className='my-30 max-w-[1100px] mx-auto flex flex-col gap-30'>
            {(componentLib === 'mui') && (
              <MuiCssBaseline />
            )}
            <StandardExample
              initialView='timeGridWeek'
              className={exampleClassName}
              borderless={borderless}
              theme={theme}
              themePlugin={themePlugin}
              colorScheme={colorScheme}
              ToolbarComponent={ToolbarComponent}
            />
            <StandardExample
              className={exampleClassName}
              borderless={borderless}
              theme={theme}
              themePlugin={themePlugin}
              colorScheme={colorScheme}
              ToolbarComponent={ToolbarComponent}
            />
            <PremiumExample
              className={exampleClassName}
              borderless={borderless}
              theme={theme}
              themePlugin={themePlugin}
              colorScheme={colorScheme}
              ToolbarComponent={ToolbarComponent}
            />
          </div>
        </MuiThemeProvider>
      </div>
    </>
  )
}

interface ToolbarProps {
  controller: CalendarController
  borderless: boolean
  buttons: ButtonStateMap
  availableViews: string[]
}

function ShadcnToolbar({ controller, borderless, buttons, availableViews }: ToolbarProps) {
  return (
    <div className={cn(
      'flex items-center justify-between py-3',
      borderless && 'px-3',
    )}>
      <div className='flex items-center gap-2'>
        <Button
          onClick={() => controller.today()}
          disabled={buttons.today.isDisabled}
          aria-label={buttons.today.hint}
          variant='outline'
        >{buttons.today.text}</Button>
        <div className='flex items-center'>
          <Button
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
            variant='ghost'
            size='icon'
          ><ChevronLeftIcon /></Button>
          <Button
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
            variant='ghost'
            size='icon'
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div className='text-xl'>{controller.view?.title}</div>
      </div>
      <Tabs value={controller.view?.type}>
        <TabsList>
          {availableViews.map((availableView) => (
            <TabsTrigger
              key={availableView}
              value={availableView}
              onClick={() => controller.changeView(availableView)}
              aria-label={buttons[availableView]?.hint}
            >{buttons[availableView]?.text}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

function MuiToolbar({ controller, borderless, buttons, availableViews }: ToolbarProps) {
  return (
    <div className={cn(
      'flex items-center justify-between py-3',
      borderless && 'px-3',
    )}>
      <div className='flex items-center gap-2'>
        <MuiButton
          onClick={() => controller.today()}
          disabled={buttons.today.isDisabled}
          aria-label={buttons.today.hint}
          variant="contained"
        >{buttons.today.text}</MuiButton>
        <div className='flex items-center'>
          <MuiIconButton
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
          ><MuiChevronLeftIcon /></MuiIconButton>
          <MuiIconButton
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
          ><MuiChevronRightIcon /></MuiIconButton>
        </div>
        <MuiTypography variant="h5">{controller.view?.title}</MuiTypography>
      </div>
      <MuiTabs value={controller.view?.type}>
        {availableViews.map((availableView) => (
          <MuiTab
            key={availableView}
            value={availableView}
            onClick={() => controller.changeView(availableView)}
            label={buttons[availableView]?.text}
            aria-label={buttons[availableView]?.hint}
          />
        ))}
      </MuiTabs>
    </div>
  )
}

interface ExampleProps {
  className: string
  borderless: boolean
  theme: string
  themePlugin: PluginDef
  colorScheme: 'light' | 'dark'
  ToolbarComponent?: React.ComponentType<ToolbarProps>
}

const standardAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]

function StandardExample(props: ExampleProps & { initialView?: string }) {
  const { ToolbarComponent } = props
  const controller = useCalendarController()
  const buttons = controller.getButtonState()

  return (
    <div className={cn('flex flex-col', props.className)}>
      {ToolbarComponent && (
        <ToolbarComponent
          controller={controller}
          borderless={props.borderless}
          buttons={buttons}
          availableViews={standardAvailableViews}
        />
      )}
      <FullCalendar
        navLinkDayClick='timeGridDay'
        navLinkWeekClick='timeGridWeek'
        schedulerLicenseKey='CC-Attribution-NonCommercial-NoDerivatives'
        colorScheme={props.colorScheme}
        controller={controller}
        weekNumbers={true}
        plugins={[
          scrollGridPlugin,
          adaptivePlugin,
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin,
          multiMonthPlugin,
          props.themePlugin,
        ]}
        eventInteractive={true}
        initialView={props.initialView ?? standardAvailableViews[0]}
        nowIndicator={true}
        borderless={props.borderless}
        headerToolbar={
          ToolbarComponent ? false : {
            left: 'today prev,next title',
            center: '',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek,multiMonthYear',
          }
        }
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
            : {}
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
        events={[
          {
            "title": "All Day Event",
            "start": "2025-07-01"
          },
          {
            "title": "Long Event",
            "start": "2025-07-07",
            "end": "2025-07-17"
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
            "start": "2025-07-04T14:30:00+00:00"
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
    </div>
  )
}

const premiumAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]

function PremiumExample(props: ExampleProps) {
  const { ToolbarComponent } = props
  const controller = useCalendarController()
  const buttons = controller.getButtonState()

  return (
    <div className={cn('flex flex-col', props.className)}>
      {ToolbarComponent && (
        <ToolbarComponent
          controller={controller}
          borderless={props.borderless}
          buttons={buttons}
          availableViews={premiumAvailableViews}
        />
      )}
      <FullCalendar
        navLinkDayClick='resourceTimelineDay'
        navLinkWeekClick='resourceTimelineWeek'
        schedulerLicenseKey='CC-Attribution-NonCommercial-NoDerivatives'
        colorScheme={props.colorScheme}
        controller={controller}
        plugins={[
          adaptivePlugin,
          timelinePlugin,
          resourceTimelinePlugin,
          resourceTimeGridPlugin,
          resourceDayGridPlugin,
          scrollGridPlugin,
          interactionPlugin,
          props.themePlugin,
        ]}
        initialView={premiumAvailableViews[0]}
        timeZone='UTC'
        dayMinWidth={200}
        editable={true}
        selectable={true}
        nowIndicator={true}
        aspectRatio={1.6}
        scrollTime='07:00'
        borderless={props.borderless}
        headerToolbar={
          ToolbarComponent ? false : {
            left: 'today prev,next',
            center: 'title',
            right: 'resourceTimelineWeek,resourceTimelineDay',
          }
        }
        buttons={{
          resourceTimelineThreeDays: {
            text: '3 days',
          }
        }}
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
    </div>
  )
}
