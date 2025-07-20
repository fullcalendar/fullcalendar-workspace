import { CalendarOptions } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-monarch/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-monarch/slots'
import { useTheme } from '@mui/material'
import React from 'react'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

export const optionParams: EventCalendarOptionParams = {
  // TODO: better hasNavLink
  // TODO: use --mui-palette-secondary-mainChannel to choose opacity
  todayPillClass: () => 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)',
  pillClass: () => 'bg-(--mui-palette-secondary-light) dark:bg-(--mui-palette-secondary-dark) text-(--mui-palette-secondary-contrastText)',

  highlightClass: 'bg-(--mui-palette-secondary-main) opacity-10',
  disabledBgClass: 'bg-(--mui-palette-action-disabledBackground)',

  borderColorClass: 'border-(--mui-palette-divider)',
  majorBorderColorClass: 'border-(--mui-palette-primary-main)', // will have color. might be cool
  alertBorderColorClass: 'border-(--mui-palette-error-main)',

  /*
  canvasBgColorClass: '',
  canvasOutlineColorClass: '',
  */

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export function EventCalendarView(options: CalendarOptions) {
  const theme = useTheme()

  if (!theme.cssVariables) {
    throw new Error('@mui/material-ui theme cssVariables must be enabled')
  }

  return (
    <FullCalendar
      {...baseEventCalendarOptions.optionDefaults}
      {...eventCalendarIconOptions}

      {...createSlots({
        createElement: React.createElement as any, // HACK
        Fragment: React.Fragment as any, // HACK
      }, optionParams)}

      {...options}

      views={{
        ...baseEventCalendarOptions.views,
        ...options.views,
      }}
    />
  )
}

/*
TODO: use shadows and border-radius somehow!!! They're in the theme object

rounded:
  - root calendar --- okay for default-ui to decide
  - popover () --- we use whole class for this. see below

  (all use small... but has smallTop/Bottom/Start/End variations!)
  - block events
  - list-item events (for hover) -- either list-view or daygrid
  - more-link

  - singleMonth tableBody

shadows:
  - popover --- we use whole class for this
  - event interactions --- we should not care!!! base can decide!!! not initially visible anyway
    block:
      - focus: md
      - selected: md
      - dragging: lg
*/

/*
borderRadius: theme.shape.borderRadius, // MuiPaper-rounded --> --mui-shape-borderRadius
backgroundColor: theme.palette.background.paper, // MuiPopover-paper --> --mui-palette-background-paper/--mui-palette-text-primary
boxShadow: theme.shadows[8], // --mui-shadows-8
-->results in a simple popoverClass
(but no way to do a transition though... in v2 when popovers are dont completely by UI-lib)

classNames:
  MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation8 MuiPopover-paper css-h9s8rt
style:
  --Paper-shadow: var(--mui-shadows-8, 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12));
  --Paper-overlay: var(--mui-overlays-8, linear-gradient(rgba(255 255 255 / 0.119), rgba(255 255 255 / 0.119)));
  opacity: 1;
  transform: none;
  transition: opacity 211ms cubic-bezier(0.4, 0, 0.2, 1), transform 141ms cubic-bezier(0.4, 0, 0.2, 1);
  top: 200px;
  left: 765px;
  transform-origin: 116px 0px;
*/
