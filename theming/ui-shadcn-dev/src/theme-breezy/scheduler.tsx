import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-breezy-dev/options-scheduler'
import { cn, ClassValue } from '../lib/utils.js'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { eventCalendarPlugins } from '../lib/event-calendar-presets.js'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '../lib/scheduler-presets.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'
import { EventCalendarView } from './event-calendar.js'
import { params } from '../lib/option-params.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(params)

export interface SchedulerProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: ClassValue
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins,
  ...restOptions
}: SchedulerProps) {
  const controller = useCalendarController()
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessTop = restOptions.borderlessTop ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <div
      className={cn(
        className,
        'flex flex-col bg-background',
        !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-lg overflow-hidden',
        !borderlessX && 'border-x',
        !borderlessTop && 'border-t',
        !borderlessBottom && 'border-b',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className='border-b p-4 bg-muted/50 text-sidebar-foreground'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <SchedulerView
          height={height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          controller={controller}
          plugins={[
            ...eventCalendarPlugins,
            ...schedulerOnlyPlugins,
            ...(userPlugins || []),
          ]}
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
