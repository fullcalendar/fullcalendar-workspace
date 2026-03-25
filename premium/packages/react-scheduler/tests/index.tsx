import React, { createRef, act } from 'react'
import { render } from '@testing-library/react'
import FullCalendar from '@fullcalendar/react'

/*
Only works on build dist code!
*/
import adaptivePlugin from '../dist/adaptive'
import resourceTimelinePlugin from '../dist/resource-timeline'

// https://github.com/fullcalendar/fullcalendar/issues/7419
it('render custom event JSX during print-mode', (done) => {
  let calendarRef = createRef<FullCalendar>()

  const { container } = render(
    <FullCalendar
      ref={calendarRef}
      initialDate={NOW_DATE}
      plugins={[timeGridPlugin, adaptivePlugin]}
      initialView="timeGridWeek"
      initialEvents={[
        {
          title: 'event1',
          start: NOW_DATE,
        }
      ]}
      eventContent={(data) => <i>{data.event.title}</i>}
    />
  )

  act(() => {
    const api = calendarRef.current.getApi()
    api.trigger('_beforeprint')

    // HACK: this timeout is not accurate. printing should not rely on timeout.
    // However, the feature ultimately works in live testing when triggering browser printing.
    // TODO: refactor synchronicity
    setTimeout(() => {
      const eventEls = getEventEls(container)
      expect(eventEls[0].querySelector('i')).toBeTruthy()
      done()
    })
  })
})

// https://github.com/fullcalendar/fullcalendar/issues/7153
it('renders resourceColumnHeaderContent jsx', () => {
  const { container } = render(
    <FullCalendar
      plugins={[resourceTimelinePlugin]}
      initialView="resourceTimelineDay"
      resources={[
        { num: '22', name: 'John' },
        { num: '66', name: 'Glen' },
      ]}
      resourceColumnHeaderContent={<div className='test-header'>Resource Area Header</div>}
      resourceColumns={[
        { field: 'num', headerContent: <div className='test-col0'>Num</div> },
        { field: 'name', headerContent: <div className='test-col1'>Name</div> },
      ]}
    />
  )

  expect(container.querySelectorAll('.test-header').length).toBe(1)
  expect(container.querySelectorAll('.test-col0').length).toBe(1)
  expect(container.querySelectorAll('.test-col1').length).toBe(1)
})

// https://github.com/fullcalendar/fullcalendar/issues/7203
it('renders resourceGroupLaneContent function', () => {
  const { container } = render(
    <FullCalendar
      plugins={[resourceTimelinePlugin]}
      initialView="resourceTimelineDay"
      resources={[
        { num: '22', name: 'John' },
        { num: '66', name: 'Glen' },
      ]}
      resourceColumns={[
        { field: 'num' },
        { field: 'name' },
      ]}
      resourceGroupField='num'
      resourceGroupLaneContent={() => (
        <span className='test-group-lane' />
      )}
    />
  )

  expect(container.querySelectorAll('.test-group-lane').length).toBe(2)
})

// DOM utils
// -------------------------------------------------------------------------------------------------

function getEventEls(container: HTMLElement): HTMLElement[] {
  return [...(container.querySelectorAll('.fc-event') as NodeListOf<HTMLElement>)]
}
