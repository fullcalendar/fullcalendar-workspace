import React from 'react'
import FullCalendar, { type CalendarOptions, useCalendarController } from '@fullcalendar/react'
import { mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { createEventCalendarOptions } from '@fullcalendar/theme-forma-tailwind/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-forma-tailwind/slots'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import { cn } from '../lib/utils'
import { params } from '../lib/option-params'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons'
import { EventCalendarProps } from '../lib/event-calendar-props'

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
        (hasBorderTop && hasBorderX) && 'rounded-t-sm',
        (hasBorderBottom && hasBorderX) && 'rounded-b-sm',
        (hasBorderX && hasBorderTop && hasBorderBottom) && 'shadow-xs',
        !isHeightAuto && 'overflow-hidden', // for rounded
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className='border-b p-3'
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

const extendedParams = {
  ...params,
  eventColor: 'var(--chart-2)', // more fluorescent than primary
  highlightClass: 'bg-chart-1/15', // slightly lighter than standard 20%, for lighter events
}
const baseEventCalendarOptions = createEventCalendarOptions(extendedParams)
const slots = createSlots(extendedParams)

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
