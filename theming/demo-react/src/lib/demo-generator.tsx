import { ReactNode } from 'react'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import { EventCalendarProps } from '@fullcalendar/theme-common/event-calendar'
import { SchedulerProps } from '@fullcalendar/theme-common/scheduler'
import { eventCalendarProps, resourceTimelineProps, vResourceProps } from './demo-config.js'

export interface DemoGeneratorProps {
  renderEventCalendar: (props: EventCalendarProps) => ReactNode
  renderResourceTimeline: (props: SchedulerProps) => ReactNode
  renderResourceTimeGrid: (props: SchedulerProps) => ReactNode
}

export function DemoGenerator(props: DemoGeneratorProps) {
  return (
    <div className='demo-container'>
      {props.renderEventCalendar({
        ...eventCalendarProps,
        initialView: 'dayGridMonth',
        availableViews: ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek', 'multiMonthYear'],
        plugins: [scrollGridPlugin, adaptivePlugin],
      })}

      {props.renderEventCalendar({
        ...eventCalendarProps,
        initialView: 'timeGridWeek',
        plugins: [scrollGridPlugin, adaptivePlugin],
      })}

      {props.renderEventCalendar({
        ...eventCalendarProps,
        initialView: 'multiMonthYear',
        plugins: [scrollGridPlugin, adaptivePlugin],
      })}

      {props.renderEventCalendar({
        ...eventCalendarProps,
        initialView: 'dayGridYear',
        availableViews: ['dayGridYear'],
        plugins: [scrollGridPlugin, adaptivePlugin],
      })}

      {props.renderEventCalendar({
        ...eventCalendarProps,
        initialView: 'listYear',
        availableViews: ['listYear', 'listMonth', 'listWeek'],
        plugins: [scrollGridPlugin, adaptivePlugin],
        listText: '',
      })}

      {props.renderResourceTimeline({
        ...resourceTimelineProps,
        initialView: 'resourceTimelineThreeDay',
        availableViews: ['resourceTimelineDay', 'resourceTimelineThreeDay', 'resourceTimelineWeek'],
      })}

      {props.renderResourceTimeGrid({
        ...vResourceProps,
        initialView: 'resourceTimeGridFiveDay',
        availableViews: ['resourceTimeGridDay', 'resourceTimeGridTwoDay', 'resourceTimeGridFiveDay', 'resourceTimeGridWeek'],
      })}
    </div>
  )
}

