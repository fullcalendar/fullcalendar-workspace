import React from 'react'
import FullCalendar, { CalendarOptions, useCalendarController } from '@fullcalendar/react'
import { mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { createEventCalendarOptions } from '@fullcalendar/theme-monarch-tailwind/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-monarch-tailwind/slots'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import { cn } from '../lib/utils.js'
import { params } from '../lib/option-params.js'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'
import { EventCalendarProps } from '../lib/event-calendar-props.js'

const navLinkDayClick = 'timeGridDay'
const navLinkWeekClick = 'timeGridWeek'

export function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()

  const hasBorderX = !(restOptions.borderlessX ?? restOptions.borderless)
  const hasBorderTop = !(restOptions.borderlessTop ?? restOptions.borderless)
  const hasBorderBottom = !(restOptions.borderlessBottom ?? restOptions.borderless)
  const isHeightAuto = height === 'auto' || contentHeight === 'auto'

  return (
    <div
      className={cn(
        className,
        'flex flex-col bg-background',
        hasBorderX && 'border-x',
        hasBorderTop && 'border-t',
        hasBorderBottom && 'border-b',
        (hasBorderTop && hasBorderX) && 'rounded-t-lg',
        (hasBorderBottom && hasBorderX) && 'rounded-b-lg',
        !isHeightAuto && 'overflow-hidden', // for rounded
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className='p-4'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <EventCalendarViews
          height={isHeightAuto ? 'auto' : height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          navLinkDayClick={navLinkDayClick}
          navLinkWeekClick={navLinkWeekClick}
          controller={controller}
          plugins={[...eventCalendarPlugins, ...userPlugins]}
          {...restOptions}
        />
      </div>
    </div>
  )
}

const baseEventCalendarOptions = createEventCalendarOptions(params)

const slots = createSlots(params)

export function EventCalendarViews({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <FullCalendar

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        userViews || {},
      )}

      // spreads
      {...baseEventCalendarOptions.optionDefaults}
      {...restOptions}
      {...eventCalendarIconOptions}
      {...slots}
    />
  )
}
