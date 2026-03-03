import { type CalendarOptions, useCalendarController } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import listPlugin from '@fullcalendar/react/list'
import multiMonthPlugin from '@fullcalendar/react/multimonth'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import { EventCalendarContainer } from '@/components/ui/event-calendar-container'
import { EventCalendarToolbar } from '@/components/event-calendar-toolbar'
import { EventCalendarViews } from '@/components/ui/event-calendar-views'
import { EventCalendarCloseIcon } from '@/components/event-calendar-icons'

const plugins = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]
const defaultAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]
const navLinkDayClick = 'timeGridDay'
const navLinkWeekClick = 'timeGridWeek'

export interface EventCalendarProps extends Omit<CalendarOptions, 'class'> {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function EventCalendar({
  availableViews = defaultAvailableViews,
  addButton,
  direction,
  className,
  height,
  contentHeight,
  plugins: userPlugins = [],
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()
  const autoHeight = height === 'auto' || contentHeight === 'auto'

  return (
    <EventCalendarContainer
      direction={direction}
      className={className}
      height={height}
      borderless={restOptions.borderless}
      borderlessX={restOptions.borderlessX}
      borderlessTop={restOptions.borderlessTop}
      borderlessBottom={restOptions.borderlessBottom}
    >
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <EventCalendarViews
        controller={controller}
        liquidHeight={!autoHeight && height !== undefined}
        height={autoHeight ? 'auto' : contentHeight}
        initialView={availableViews[0]}
        navLinkDayClick={navLinkDayClick}
        navLinkWeekClick={navLinkWeekClick}
        plugins={[...plugins, ...userPlugins]}
        popoverCloseContent={() => (
          <EventCalendarCloseIcon />
        )}
        {...restOptions}
      />
    </EventCalendarContainer>
  )
}
