import React from 'react'
import { render } from '@testing-library/react'
import Calendar from './Calendar'

test.each([
  ['dayGridDay', 'fc-daygrid'],
  ['timeGridDay', 'fc-timegrid'],
  ['timelineDay', 'fc-timeline']
])('%s renders structure and events', (initialView, viewClassName) => {
  let eventContentCalls = 0
  const { container } = render(
    <Calendar
      initialView={initialView}
      eventContent={(arg) => {
        eventContentCalls++
        return arg.event.title + '!'
      }}
    />
  )

  expect(
    container.querySelector(`.${viewClassName}`)
  ).toBeInTheDocument()

  expect(
    container.querySelectorAll(`.${viewClassName}-event`).length
  ).toBeGreaterThan(0)

  expect(eventContentCalls).toBeGreaterThan(0)
})
