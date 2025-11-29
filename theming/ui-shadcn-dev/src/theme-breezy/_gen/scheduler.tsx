import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { cn, ClassValue } from '../../lib/utils.js'
import { ChevronDownIcon } from 'lucide-react'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import {
  EventCalendarToolbar,
  EventCalendarView,
  outlineWidthFocusClass,
  outlineColorClass,
  strongSolidPressableClass,
  mutedBgClass,
  mutedFgPressableGroupClass,
} from './event-calendar.js'

const eventCalendarPlugins = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]

const schedulerOnlyPlugins = [
  adaptivePlugin,
  scrollGridPlugin,
  timelinePlugin,
  resourceTimelinePlugin,
  resourceTimeGridPlugin,
  resourceDayGridPlugin,
]

const schedulerAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]

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
}: CalendarOptions) {
  return (
    <EventCalendarView

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderAlign="center"

      resourceDayHeaderClass="border"
      resourceDayHeaderInnerClass={(data) => [
        `p-2  font-semibold`,
        data.isNarrow ? 'text-xs' : 'text-sm',
      ]}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceColumnHeaderClass="border  justify-center" // v-align
      resourceColumnHeaderInnerClass="p-2  text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"

      // group header
      resourceGroupHeaderClass={`border  ${mutedBgClass}`}
      resourceGroupHeaderInnerClass="p-2  text-sm"

      // cell
      resourceCellClass="border "
      resourceCellInnerClass="p-2  text-sm"

      // row expander
      resourceIndentClass="ms-1 -me-1.5 justify-center" // v-align
      resourceExpanderClass={[
        'group p-0.5 rounded-full',
        `${mutedBgClass} hover:bg-foreground/10`,
        outlineWidthFocusClass,
        outlineColorClass,
      ]}
      resourceExpanderContent={(data) => (
        <ChevronDownIcon
          className={cn(
            `size-4 m-px ${mutedFgPressableGroupClass}`,
            !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
          )}
        />
      )}

      // row
      resourceHeaderRowClass="border "
      resourceRowClass="border "

      // divider between data grid & timeline
      resourceColumnDividerClass="border-e border-foreground/20"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass={`border  ${mutedBgClass}`}
      resourceLaneClass="border "
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-2'}
      timelineBottomClass="h-2"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        resourceDayGrid: {
          resourceDayHeaderClass: (data) => (
            data.isMajor
              ? 'border-foreground/20'
              : ''
          ),
          ...userViews?.resourceDayGrid,
        },
        resourceTimeGrid: {
          resourceDayHeaderClass: (data) => (
            data.isMajor
              ? 'border-foreground/20'
              : 'border-muted-foreground'
          ),
          ...userViews?.resourceTimeGrid,
        },
        timeline: {
          /* Timeline > Row Event
          ----------------------------------------------------------------------------------------- */

          rowEventClass: (data) => data.isEnd && 'me-px',
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          ----------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px border border-transparent print:border-black rounded-md',
            `${strongSolidPressableClass} print:bg-white`,
          ],
          rowMoreLinkInnerClass: 'p-1  text-xs',

          /* Timeline > Slot Header
          ----------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center', // h-align

          slotHeaderClass: (data) => [
            data.level > 0 && `border border-muted-foreground`,
            'justify-end', // v-align
          ],
          slotHeaderInnerClass: (data) => [
            'px-3 py-2 text-xs',
            data.isTime && cn(
              'relative -start-4',
              data.isFirst && 'hidden',
            ),
            data.hasNavLink && 'hover:underline',
          ],

          // divider between label and lane
          slotHeaderDividerClass: 'border-b border-foreground/20 shadow-sm',
          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

