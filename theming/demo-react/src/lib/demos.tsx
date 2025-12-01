import { ReactNode } from 'react'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import { EventCalendarProps } from '@fullcalendar/theme-common/event-calendar'
import { SchedulerProps } from '@fullcalendar/theme-common/scheduler'
import { eventCalendarProps, resourceTimelineProps, vResourceProps } from './demos-config.js'
import { ThemeName } from './config.js'

export interface DemosProps {
  theme: ThemeName
  renderEventCalendar: (theme: ThemeName, props: EventCalendarProps) => ReactNode
  renderScheduler: (theme: ThemeName, props: SchedulerProps) => ReactNode
}

export function Demos(props: DemosProps) {
  return (
    <>
      {props.renderEventCalendar(props.theme, {
        ...eventCalendarProps,
        initialView: 'dayGridMonth',
        availableViews: ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek', 'multiMonthYear'],
        plugins: [scrollGridPlugin, adaptivePlugin],
      })}

      {props.renderEventCalendar(props.theme, {
        ...eventCalendarProps,
        initialView: 'timeGridWeek',
        plugins: [scrollGridPlugin, adaptivePlugin],
      })}

      {props.renderEventCalendar(props.theme, {
        ...eventCalendarProps,
        initialView: 'multiMonthYear',
        plugins: [scrollGridPlugin, adaptivePlugin],
      })}

      {props.renderEventCalendar(props.theme, {
        ...eventCalendarProps,
        initialView: 'dayGridYear',
        availableViews: ['dayGridYear'],
        plugins: [scrollGridPlugin, adaptivePlugin],
      })}

      {props.renderEventCalendar(props.theme, {
        ...eventCalendarProps,
        initialView: 'listYear',
        availableViews: ['listYear', 'listMonth', 'listWeek'],
        plugins: [scrollGridPlugin, adaptivePlugin],
        listText: '',
      })}

      {props.renderScheduler(props.theme, {
        ...resourceTimelineProps,
        initialView: 'resourceTimelineThreeDay',
        availableViews: ['resourceTimelineDay', 'resourceTimelineThreeDay', 'resourceTimelineWeek'],
      })}

      {props.renderScheduler(props.theme, {
        ...vResourceProps,
        initialView: 'resourceTimeGridFiveDay',
        availableViews: ['resourceTimeGridDay', 'resourceTimeGridTwoDay', 'resourceTimeGridFiveDay', 'resourceTimeGridWeek'],
      })}
    </>
  )
}

