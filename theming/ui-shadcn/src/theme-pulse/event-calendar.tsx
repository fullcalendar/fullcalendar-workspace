import React from 'react'
import FullCalendar, { type CalendarOptions, useCalendarController } from '@fullcalendar/react'
import { mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { createEventCalendarOptions } from '@fullcalendar/theme-pulse-tailwind/options-event-calendar'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import { cn } from '../lib/utils'
import { params } from '../lib/option-params'
import { createSlots } from '@fullcalendar/theme-pulse-tailwind/slots'
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
  const hasBorderBottom = !(restOptions.borderlessBottom ?? restOptions.borderless)
  const isHeightAuto = height === 'auto' || contentHeight === 'auto'

  return (
    <div
      className={cn(className, 'flex flex-col gap-6')}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className={!hasBorderX ? 'px-3' : ''}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <EventCalendarViews
          className={cn(
            'bg-background border-t',
            hasBorderX && 'border-x',
            hasBorderBottom && 'border-b',
            (hasBorderX && !isHeightAuto) && 'rounded-t-sm',
            (hasBorderX && hasBorderBottom && !isHeightAuto) && 'rounded-b-sm',
            (hasBorderX && hasBorderBottom) && 'shadow-xs',
            !isHeightAuto && 'overflow-hidden', // for rounded
          )}
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
