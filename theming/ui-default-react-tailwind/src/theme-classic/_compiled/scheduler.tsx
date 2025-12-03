import React from 'react'
import type { CalendarOptions } from '@fullcalendar/core'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import { EventCalendar, xxsTextClass, outlineWidthFocusClass, primaryOutlineColorClass, strongSolidPressableClass } from './event-calendar.js'

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

const expanderIconClass = 'size-4 not-group-hover:opacity-65'
const continuationArrowClass = 'mx-1 border-y-[5px] border-y-transparent opacity-50'

export interface SchedulerProps extends CalendarOptions {
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
  plugins: userPlugins,
  views: userViews,
  ...restOptions
}: SchedulerProps) {
  return (
    <EventCalendar
      availableViews={availableViews}
      addButton={addButton}
      plugins={[
        ...schedulerOnlyPlugins,
        ...(userPlugins || []),
      ]}

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderAlign="center"
      resourceDayHeaderClass={(data) => [
        'border',
        data.isMajor ? 'border-(--fc-classic-strong-border)' : 'border-(--fc-classic-border)',
      ]}
      resourceDayHeaderInnerClass={(data) => [
        'px-1 py-0.5 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
      ]}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--fc-classic-border) justify-center"
      resourceColumnHeaderInnerClass="p-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border border-(--fc-classic-border) bg-(--fc-classic-muted)"
      resourceGroupHeaderInnerClass="p-2 text-sm"
      resourceCellClass="border border-(--fc-classic-border)"
      resourceCellInnerClass="p-2 text-sm"
      resourceIndentClass="ms-2 -me-1 justify-center"
      resourceExpanderClass={[
        'group',
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      resourceExpanderContent={(data) => data.isExpanded
        ? minusSquare(expanderIconClass)
        : plusSquare(expanderIconClass)}
      resourceHeaderRowClass="border border-(--fc-classic-border)"
      resourceRowClass="border border-(--fc-classic-border)"
      resourceColumnDividerClass="border-x border-(--fc-classic-border) ps-0.5 bg-(--fc-classic-muted)"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border border-(--fc-classic-border) bg-(--fc-classic-muted)"
      resourceLaneClass="border border-(--fc-classic-border)"
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-3'}
      timelineBottomClass="h-3"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => [
            data.isEnd && 'me-px',
            'items-center',
          ],
          rowEventBeforeClass: (data) => (
            !data.isStartResizable && `${continuationArrowClass} border-e-[5px] border-e-black`
          ),
          rowEventAfterClass: (data) => (
            !data.isEndResizable && `${continuationArrowClass} border-s-[5px] border-s-black`
          ),
          rowEventInnerClass: (data) => (
            data.options.eventOverlap
              ? 'py-0.5'
              : 'py-1.5'
          ),
          rowEventTimeClass: 'px-0.5',
          rowEventTitleClass: 'px-0.5',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px border border-transparent print:border-black',
            `${strongSolidPressableClass} print:bg-white`,
          ],
          rowMoreLinkInnerClass: 'p-0.5 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: 'justify-center',
          slotHeaderInnerClass: (data) => [
            'p-2 text-sm',
            data.hasNavLink && 'hover:underline',
          ],
          slotHeaderDividerClass: 'border-b border-(--fc-classic-border)',

          /* Timeline > Now-Indicator
          --------------------------------------------------------------------------------------- */

          nowIndicatorHeaderClass: [
            'top-0 -mx-[5px]',
            'border-x-[5px] border-x-transparent',
            'border-t-[6px] border-(--fc-classic-now)',
          ],
          nowIndicatorLineClass: 'border-s border-(--fc-classic-now)',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

/* SVGs
------------------------------------------------------------------------------------------------- */

function plusSquare(className?: string) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
}

function minusSquare(className?: string) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></svg>
}
