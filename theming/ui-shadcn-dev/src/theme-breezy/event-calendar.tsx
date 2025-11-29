/*
Take this file and transform it into a new file ./_gen/event-calendar.tsx
Inline all symbols from ../lib/, but keep them as consts/functions (do NOT inline their primitive values).
Exception: do NOT inline the cn() function or ClassValue types. Refer to them in their original file.
Attempt to evaluate the result of createEventCalendarOptions, which is a set of props. Spread those props directly into the JSX components' props.
Same with the result of createSlots.
Some of the props from option-params.ts might not be used in the generated file. Ensure no resulting unused consts.
Do NOT inline any @fullcalendar packages.
Replace all uses if our joinClassNames function with the shadcn cn() function
When spreading multiple props into the same set of props, keep the props grouped by the sections you see like this:

  /* Day Header
  ------------------------------------------------

Those same sections and section blocks comments are present in the `views` map. Preserve those too:

  views: {
    /* Some View
    ------------------------------------------------
  }

Please also keep the header at the top of any `views`, that looks something like this:

  /* View-Specific Options
  ------------------------------------------------

Also keep the //-style comments at the tops of code blocks like this:

  // some comment
  const whatever = 'cool'
  const nice = 'yes'

Merge same-name sections.
For merging `userViews` or `views`, instead of relying on `mergeViewOptionsMap`, do something like this:

  views={{
    ...userViews,
    dayGrid: {
      prop0: '',
      prop1: '',
      ...userViews?.dayGrid,
    },
    timeGrid: {
      prop0: '',
      prop1: '',
      ...userViews?.timeGrid,
    },
  }}

The resulting file will have multiple components. Please order them like so:
  - main component
  - toolbar component
  - view component
*/

import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions } from '@fullcalendar/theme-breezy-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-breezy-dev/slots'
import { cn, ClassValue } from '../lib/utils.js'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '../lib/event-calendar-presets.js'
import { params } from '../lib/option-params.js'

export interface EventCalendarProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: ClassValue
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins,
  ...restOptions
}: EventCalendarProps) {
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
        className='border-b p-4 bg-sidebar text-sidebar-foreground'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <EventCalendarView
          height={height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          controller={controller}
          plugins={[
            ...eventCalendarPlugins,
            ...(userPlugins || []),
          ]}
          {...restOptions}
        />
      </div>
    </div>
  )
}

const baseEventCalendarOptions = createEventCalendarOptions(params)

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, params)

export function EventCalendarView({
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
