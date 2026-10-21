/// <reference types="vitest/globals" />
import React from 'react'
import { renderToString } from 'react-dom/server'

/*
Server rendering. Static and synchronous sources resolve during the render, so the server's HTML has
their events. A behavior lock for phase 9 (planning/phase-9-store.md), which must not move fetching
after the commit. Only works on build dist code!
*/
import FullCalendar from '../dist/index'
import dayGridPlugin from '../dist/daygrid'

const OPTIONS = {
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  initialDate: '2024-01-10',
}

it('renders array events on the server', () => {
  const html = renderToString(
    <FullCalendar
      {...OPTIONS}
      events={[{ title: 'array-event', start: '2024-01-10' }]}
    />,
  )

  expect(html).toContain('array-event')
})

it('renders the events of a synchronous function source on the server', () => {
  const html = renderToString(
    <FullCalendar
      {...OPTIONS}
      events={(_info, successCallback) => {
        successCallback([{ title: 'function-event', start: '2024-01-10' }])
      }}
    />,
  )

  expect(html).toContain('function-event')
})
