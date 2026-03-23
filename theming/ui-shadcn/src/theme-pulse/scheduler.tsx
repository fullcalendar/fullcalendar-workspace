import React from 'react'
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-pulse-tailwind/options-scheduler'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { cn } from '../lib/utils.js'
import { eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '@fullcalendar/theme-common/scheduler'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'
import { EventCalendarView } from './event-calendar.js'
import { params } from '../lib/option-params.js'
import { SchedulerProps } from '../lib/scheduler-props.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(params)

const navLinkDayClick = 'resourceTimelineDay'
const navLinkWeekClick = 'resourceTimelineWeek'

export function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: SchedulerProps) {
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
        <SchedulerView
          className={cn(
            'bg-background border-t',
            hasBorderX && 'border-x',
            hasBorderBottom && 'border-b',
            (hasBorderX && !isHeightAuto) && 'rounded-t-sm',
            (hasBorderBottom && hasBorderX && !isHeightAuto) && 'rounded-b-sm',
            !isHeightAuto && 'overflow-hidden', // for rounded
          )}
          height={isHeightAuto ? 'auto' : height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          navLinkDayClick={navLinkDayClick}
          navLinkWeekClick={navLinkWeekClick}
          controller={controller}
          plugins={[...eventCalendarPlugins, ...schedulerOnlyPlugins, ...userPlugins]}
          {...restOptions}
        />
      </div>
    </div>
  )
}

export function SchedulerView({
  views: userViews,
  ...restOptions
}: any) {
  return (
    <EventCalendarView

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={mergeViewOptionsMap(
        baseSchedulerOnlyOptions.views || {},
        userViews || {},
      )}

      // spreads
      {...baseSchedulerOnlyOptions.optionDefaults}
      {...restOptions}
      {...schedulerOnlyIconOptions}
    />
  )
}
