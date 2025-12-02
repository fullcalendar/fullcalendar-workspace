import { ReactNode } from 'react'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import { EventCalendarProps } from '@fullcalendar/theme-common/event-calendar'
import { SchedulerProps } from '@fullcalendar/theme-common/scheduler'
import { eventCalendarProps, resourceTimelineProps, vResourceProps } from './demo-config.js'

export interface DemosProps {
  renderEventCalendar: (props: EventCalendarProps) => ReactNode
  renderScheduler: (props: SchedulerProps) => ReactNode
}

export function Demos(props: DemosProps) {
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

      {props.renderScheduler({
        ...resourceTimelineProps,
        initialView: 'resourceTimelineThreeDay',
        availableViews: ['resourceTimelineDay', 'resourceTimelineThreeDay', 'resourceTimelineWeek'],
      })}

      {props.renderScheduler({
        ...vResourceProps,
        initialView: 'resourceTimeGridFiveDay',
        availableViews: ['resourceTimeGridDay', 'resourceTimeGridTwoDay', 'resourceTimeGridFiveDay', 'resourceTimeGridWeek'],
      })}
    </div>
  )
}

