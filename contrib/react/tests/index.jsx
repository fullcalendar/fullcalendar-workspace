import React, { useState, useEffect, useContext, useCallback, createContext, createRef, act } from 'react'
import { render } from '@testing-library/react'
import FullCalendar from '../dist/index.js'
import adaptivePlugin from '@fullcalendar/adaptive'
import { sliceEvents } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import timeGridPlugin from '@fullcalendar/timegrid'
import { anyElsIntersect } from './utils.js'

const NOW_DATE = new Date()
const DEFAULT_OPTIONS = {
  plugins: [dayGridPlugin, listPlugin]
}

it('should render without crashing', () => {
  let { container } = render(
    <FullCalendar {...DEFAULT_OPTIONS} />
  )
  expect(getHeaderToolbarEl(container)).toBeTruthy()
})

it('should unmount and destroy', () => {
  let unmountCalled = false

  let { unmount } = render(
    <FullCalendar
      {...DEFAULT_OPTIONS}
      viewWillUnmount={() => {
        unmountCalled = true
      }}
    />
  )

  unmount()
  expect(unmountCalled).toBe(true)
})

it('should have updatable props', () => {
  let { container, rerender } = render(
    <FullCalendar {...DEFAULT_OPTIONS} />
  )
  expect(isWeekendsRendered(container)).toBe(true)

  rerender(
    <FullCalendar {...DEFAULT_OPTIONS} weekends={false} />
  )
  expect(isWeekendsRendered(container)).toBe(false)
})

it('should accept a callback', () => {
  let mountCalled = false

  render(
    <FullCalendar
      {...DEFAULT_OPTIONS}
      viewDidMount={() => {
        mountCalled = true
      }}
    />
  )
  expect(mountCalled).toBe(true)
})

it('should expose an API', function() {
  let componentRef = React.createRef()
  render(
    <FullCalendar {...DEFAULT_OPTIONS} ref={componentRef} />
  )

  let calendarApi = componentRef.current.getApi()
  expect(calendarApi).toBeTruthy()

  let newDate = new Date(Date.UTC(2000, 0, 1))
  calendarApi.gotoDate(newDate)
  expect(calendarApi.getDate().valueOf()).toBe(newDate.valueOf())
})

it('won\'t rerender toolbar if didn\'t change', function() { // works because internal VDOM reuses toolbar element
  let { container, rerender } = render(
    <FullCalendar {...DEFAULT_OPTIONS} headerToolbar={buildToolbar()} />
  )
  let headerEl = getHeaderToolbarEl(container)

  rerender(
    <FullCalendar {...DEFAULT_OPTIONS} headerToolbar={buildToolbar()} />
  )
  expect(getHeaderToolbarEl(container)).toBe(headerEl)
})

it('won\'t rerender events if nothing changed', function() {
  let options = {
    ...DEFAULT_OPTIONS,
    events: [buildEvent()]
  }

  let { container, rerender } = render(
    <FullCalendar {...options} />
  )
  let eventEl = getFirstEventEl(container)

  rerender(
    <FullCalendar {...options} />
  )
  expect(getFirstEventEl(container)).toBe(eventEl)
})

// https://github.com/fullcalendar/fullcalendar-react/issues/185
it('will not inifinitely recurse in strict mode with datesSet', function(done) {
  let calledDone = false

  function TestApp() {
    const [events, setEvents] = useState([
      { title: 'event 1', date: '2022-04-01' },
      { title: 'event 2', date: '2022-04-02' }
    ]);

    const dateChange = () => {
      setEvents([
        { title: 'event 10', date: '2022-04-01' },
        { title: 'event 20', date: '2022-04-02' }
      ]);
    };

    useEffect(() => {
      setTimeout(() => {
        if (!calledDone) {
          calledDone = true
          done()
        }
      }, 100)
    });

    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView='dayGridMonth'
        events={events}
        datesSet={dateChange}
      />
    );
  }

  render(
    <React.StrictMode>
      <TestApp />
    </React.StrictMode>
  )
})

// https://github.com/fullcalendar/fullcalendar-react/issues/13
it('will not inifinitely recurse with datesSet and dateIncrement', function(done) {
  let calledDone = false

  function TestApp() {
    const [events, setEvents] = useState([
      { title: 'event 1', date: '2022-04-01' },
      { title: 'event 2', date: '2022-04-02' }
    ]);

    const dateChange = () => {
      setEvents([
        { title: 'event 10', date: '2022-04-01' },
        { title: 'event 20', date: '2022-04-02' }
      ]);
    };

    useEffect(() => {
      setTimeout(() => {
        if (!calledDone) {
          calledDone = true
          done()
        }
      }, 100)
    });

    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        views={{
          rollingSevenDay: {
            type: 'dayGrid',
            duration: { days: 7 },
            dateIncrement: { days: 1 },
          }
        }}
        initialView='rollingSevenDay'
        events={events}
        datesSet={dateChange}
      />
    );
  }

  render(
    <TestApp />
  )
})

it('slot rendering inherits parent context', () => {
  const ThemeColor = createContext('')

  function TestApp() {
    return (
      <ThemeColor.Provider value='red'>
        <Calendar />
      </ThemeColor.Provider>
    )
  }

  function Calendar() {
    const themeColor = useContext(ThemeColor)

    return (
      <FullCalendar
        {...DEFAULT_OPTIONS}
        initialDate='2022-04-01'
        events={[
          { title: 'event 1', date: '2022-04-01' },
        ]}
        eventContent={(arg) => (
          <span style={{ color: themeColor }}>{arg.event.title}</span>
        )}
      />
    )
  }

  let { container } = render(
    <React.StrictMode>
      <TestApp />
    </React.StrictMode>
  )

  let eventEl = getFirstEventEl(container)
  expect(eventEl.querySelector('span').style.color).toBe('red')
})

it('accepts jsx node for slot', () => {
  const { container } = render(
    <FullCalendar
      {...DEFAULT_OPTIONS}
      initialView='listDay'
      noEventsContent={<div className='empty-message'>no events</div>}
    />
  )

  expect(container.querySelectorAll('.empty-message').length).toBe(1)
})

// https://github.com/fullcalendar/fullcalendar/issues/7089
it('does not produce overlapping multiday events with custom eventContent', () => {
  const DATE = '2022-04-01'
  const EVENTS = [
    { title: 'event 1', start: '2022-04-04', end: '2022-04-09' },
    { title: 'event 2', date: '2022-04-05', end: '2022-04-08' }
  ]

  function renderEvent(eventArg) {
    return <i>{eventArg.event.title}</i>
  }

  function TestApp() {
    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView='dayGridMonth'
        initialDate={DATE}
        initialEvents={EVENTS}
        eventContent={renderEvent}
      />
    );
  }

  const { container } = render(<TestApp />)

  const eventEls = getEventEls(container)
  expect(eventEls.length).toBe(2)
  expect(anyElsIntersect(eventEls)).toBe(false)
})

// https://github.com/fullcalendar/fullcalendar/issues/7239
it('does not produce overlapping all-day & timed events with custom eventContent', () => {
  const DATE = '2022-04-01'
  const EVENTS = [
    { title: 'event 1', start: '2022-04-04', end: '2022-04-09' },
    { title: 'event 2', date: '2022-04-05T12:00:00' }
  ]

  function renderEvent(eventArg) {
    return <i>{eventArg.event.title}</i>
  }

  function TestApp() {
    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView='dayGridMonth'
        initialDate={DATE}
        initialEvents={EVENTS}
        eventContent={renderEvent}
      />
    );
  }

  const { container } = render(<TestApp />)

  const eventEls = getEventEls(container)
  expect(eventEls.length).toBe(2)
  expect(anyElsIntersect(eventEls)).toBe(false)
})

// eventDidMount
;['auto', 'background'].forEach((eventDisplay) => {
  it(`during ${eventDisplay} custom event rendering, receives el`, (done) => {
    let eventDidMountCalled = false

    function TestApp() {
      return (
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView='dayGridMonth'
          initialDate='2022-04-01'
          initialEvents={[
            { title: 'event 1', start: '2022-04-01', display: eventDisplay },
          ]}
          eventContent={(eventArg) => (
            <i>{eventArg.event.title}</i>
          )}
          eventDidMount={(eventArg) => {
            expect(eventArg.el).toBeTruthy()
            eventDidMountCalled = true
          }}
        />
      );
    }

    render(<TestApp />)
    setTimeout(() => {
      expect(eventDidMountCalled).toBe(true)
      done()
    }, 100)
  })
})

// https://github.com/fullcalendar/fullcalendar/issues/7119
it('rerenders content-injection with latest render-func closure', (done) => {
  const DATE = '2022-04-01'
  const EVENTS = [
    { title: 'event 1', start: '2022-04-04', end: '2022-04-09' }
  ]
  let incrementCounter

  function TestApp() {
    const [counter, setCounter] = useState(0)

    incrementCounter = useCallback(() => {
      setCounter(counter + 1)
    })

    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView='dayGridMonth'
        initialDate={DATE}
        initialEvents={EVENTS}
        eventContent={(eventArg) => (
          <i>{eventArg.event.title + ' - ' + counter}</i>
        )}
      />
    );
  }

  const { container } = render(<TestApp />)

  let eventEls = getEventEls(container)
  expect(eventEls.length).toBe(1)
  expect(eventEls[0].querySelector('i').innerText).toBe('event 1 - 0')

  act(() => {
    incrementCounter()
  })
  setTimeout(() => { // wait for useEffect timeout
    let newEventEls = getEventEls(container)
    expect(newEventEls.length).toBe(1)
    expect(newEventEls[0]).toBe(eventEls[0])
    expect(newEventEls[0].querySelector('i').innerText).toBe('event 1 - 1')
    done()
  }, 100)
})

it('no unnecessary rerenders, using events, when parent rerenders', () => {
  const DATE = '2022-04-01'
  const EVENTS = [
    { title: 'event 1', start: '2022-04-04', end: '2022-04-09' }
  ]
  let incrementCounter
  let customRenderCnt = 0

  function TestApp() {
    const [counter, setCounter] = useState(0)

    incrementCounter = useCallback(() => {
      setCounter(counter + 1)
    })

    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        headerToolbar={buildToolbar()}
        initialView='dayGridMonth'
        initialDate={DATE}
        events={EVENTS}
        eventContent={renderEvent}
      />
    )
  }

  function renderEvent(eventArg) {
    customRenderCnt++
    return <i>{eventArg.event.title}</i>
  }

  render(<TestApp />)
  expect(customRenderCnt).toBe(1)
  act(() => incrementCounter())
  expect(customRenderCnt).toBe(1)
})

it('no unnecessary rerenders, using eventSources, when parent rerenders', () => {
  const DATE = '2022-04-01'
  const EVENTS = [
    { title: 'event 1', start: '2022-04-04', end: '2022-04-09' }
  ]
  let incrementCounter
  let customRenderCnt = 0

  function TestApp() {
    const [counter, setCounter] = useState(0)

    incrementCounter = useCallback(() => {
      setCounter(counter + 1)
    })

    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        headerToolbar={buildToolbar()}
        initialView='dayGridMonth'
        initialDate={DATE}
        eventSources={[EVENTS]}
        eventContent={renderEvent}
      />
    )
  }

  function renderEvent(eventArg) {
    customRenderCnt++
    return <i>{eventArg.event.title}</i>
  }

  render(<TestApp />)
  expect(customRenderCnt).toBe(1)
  act(() => incrementCounter())
  expect(customRenderCnt).toBe(1)
})

// https://github.com/fullcalendar/fullcalendar/issues/7107
it('does not infinite loop on navLinks w/ dayCellContent', () => {
  function CustomDayCellContent() {
    return <div>hello world</div>
  }

  function TestApp() {
    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView='dayGridWeek'
        navLinks
        dayCellContent={() => <CustomDayCellContent />}
      />
    );
  }

  render(<TestApp />)
})

// https://github.com/fullcalendar/fullcalendar/issues/7116
it('does not infinite loop on certain eventContent', () => {
  const INITIAL_DATE = '2022-12-01'
  const EVENTS = [
    {
      start: '2022-12-31T03:40:00',
      end: '2022-12-31T07:40:00',
      title: 'titme33'
    },
    {
      start: '2022-12-30T23:00:00',
      end: '2022-12-31T00:30:00',
      title: 'titme34'
    },
    {
      start: '2022-12-30T23:00:00',
      end: '2022-12-31T00:30:00',
      title: 'titme35'
    },
    {
      start: '2022-12-30T22:30:00',
      end: '2022-12-31T00:00:00',
      title: 'titme36'
    },
    {
      start: '2022-12-30T22:00:00',
      end: '2022-12-31T07:00:00',
      title: 'titme37'
    },
    {
      start: '2022-12-30T19:20:00',
      end: '2022-12-31T01:10:00',
      title: 'titme38'
    },
    {
      start: '2022-12-30T19:00:00',
      end: '2022-12-30T20:00:00',
      title: 'titme39'
    },
    {
      start: '2022-12-30T18:30:00',
      end: '2022-12-30T19:00:00',
      title: 'titme40'
    }
  ]

  function TestApp() {
    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialDate={INITIAL_DATE}
        initialView='dayGridMonth'
        dayMaxEvents={2}
        events={EVENTS}
        eventContent={(eventArg) => <i>{eventArg.event.title}</i>}
      />
    );
  }

  render(<TestApp />)
})

it('eventContent render can return true to use default rendering', () => {
  const INITIAL_DATE = '2022-12-01'
  const EVENTS = [
    {
      start: '2022-12-31T03:40:00',
      end: '2022-12-31T07:40:00',
      title: 'titme33'
    }
  ]

  const { container } = render(
    <FullCalendar
      plugins={[dayGridPlugin]}
      initialDate={INITIAL_DATE}
      initialView='dayGridMonth'
      events={EVENTS}
      eventContent={() => true}
    />
  )

  let eventEls = getEventEls(container)
  expect(eventEls[0].innerHTML.trim()).toBeTruthy()
})

// https://github.com/fullcalendar/fullcalendar/issues/7153
it('renders resourceAreaHeaderContent jsx', () => {
  const { container } = render(
    <FullCalendar
      plugins={[resourceTimelinePlugin]}
      initialView="resourceTimelineDay"
      resources={[
        { num: '22', name: 'John' },
        { num: '66', name: 'Glen' },
      ]}
      resourceAreaHeaderContent={<div className='test-header'>Resource Area Header</div>}
      resourceAreaColumns={[
        { field: 'num', headerContent: <div className='test-col0'>Num</div> },
        { field: 'name', headerContent: <div className='test-col1'>Name</div> },
      ]}
    />
  )

  expect(container.querySelectorAll('.test-header').length).toBe(1)
  expect(container.querySelectorAll('.test-col0').length).toBe(1)
  expect(container.querySelectorAll('.test-col1').length).toBe(1)
})

it('renders actionAreaColumns jsx', () => {
  const { container } = render(
    <FullCalendar
      plugins={[resourceTimelinePlugin]}
      initialView="resourceTimelineDay"
      resources={[
        { num: '22', name: 'John' },
        { num: '66', name: 'Glen' },
      ]}
      resourceAreaHeaderContent={<div className='test-header'>Resource Area Header</div>}
      resourceAreaColumns={[
        { field: 'num', headerContent: <div className='test-col0'>Num</div> },
        { field: 'name', headerContent: <div className='test-col1'>Name</div> },
      ]}
      actionAreaColumns={[
        { field: 'actions', headerContent: <div className='test-col2'>actions</div> },
      ]}
    />
  )

  expect(container.querySelectorAll('.test-header').length).toBe(1)
  expect(container.querySelectorAll('.test-col0').length).toBe(1)
  expect(container.querySelectorAll('.test-col1').length).toBe(1)
  expect(container.querySelectorAll('.test-col2').length).toBe(1)
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
      resourceAreaColumns={[
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


;[
  'content', // https://github.com/fullcalendar/fullcalendar/issues/7160
  'component', // https://github.com/fullcalendar/fullcalendar/issues/7207
].forEach((settingName) => {
  it(`can render custom content in a custom view (with ${settingName} setting)`, () => {
    const { container } = render(
      <FullCalendar
        initialView="customView"
        views={{
          customView: {
            [settingName]: <div className='custom-view-content'>custom view content</div>
          }
        }}
      />
    )

    expect(container.querySelectorAll('.custom-view-content').length).toBe(1)
  })
})

;[
  'content',
  'component',
].forEach((settingName) => {
  it(`can render custom content AS FUNCTION in a custom view (with ${settingName} setting)`, () => {
    const { container } = render(
      <FullCalendar
        initialView="customView"
        views={{
          customView: {
            [settingName]: () => {
              return (
                <div className='custom-view-content'>custom view content</div>
              )
            }
          }
        }}
      />
    )

    expect(container.querySelectorAll('.custom-view-content').length).toBe(1)
  })
})


// https://github.com/fullcalendar/fullcalendar/issues/7189
it('custom view receives enough props for slicing', () => {
  const { container } = render(
    <FullCalendar
      initialDate={NOW_DATE}
      initialView="customView"
      initialEvents={[
        {
          title: 'event1',
          start: NOW_DATE,
        }
      ]}
      views={{
        customView: {
          content: (props) => {
            const segs = sliceEvents(props, true); // allDay=true
            return (
              <>
                <div className="custom-view-title">
                  {props.dateProfile.currentRange.start.getMonth()}
                </div>
                <div className="custom-view-events">{segs.length} events</div>
              </>
            );
          }
        }
      }}
    />
  )

  // temporary
  const test1 = container.querySelector('.custom-view-title').innerText
  const test2 = String(NOW_DATE.getMonth())
  if (test1 !== test2) {
    console.log('DEBUG!!!', test1, NOW_DATE.toString())
  }

  expect(container.querySelector('.custom-view-title').innerText).toBe(String(NOW_DATE.getMonth()))
  expect(container.querySelector('.custom-view-events').innerText).toBe('1 events')
})

// https://github.com/fullcalendar/fullcalendar/issues/7419
it('render custom event JSX during print-mode', (done) => {
  let calendarRef = createRef()

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
      eventContent={(eventArg) => <i>{eventArg.event.title}</i>}
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
      expect(eventEls[0].offsetHeight).toBeGreaterThan(10)
      done()
    })
  })
})

// FullCalendar data utils
// -------------------------------------------------------------------------------------------------

function buildToolbar() {
  return {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  }
}

function buildEvent() {
  return { title: 'event', start: new Date(NOW_DATE.valueOf()) } // consistent datetime
}

// DOM utils
// -------------------------------------------------------------------------------------------------

function getHeaderToolbarEl(container) {
  return container.querySelector('.fc-header-toolbar')
}


function isWeekendsRendered(container) {
  return Boolean(container.querySelector('.fc-day-sat'))
}


function getFirstEventEl(container) {
  return container.querySelector('.fc-event')
}

function getEventEls(container) {
  return [...container.querySelectorAll('.fc-event')]
}
