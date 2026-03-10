import * as PlainDateFns from 'temporal-polyfill/fns/plaindate'
import * as PlainDateTimeFns from 'temporal-polyfill/fns/plaindatetime'
import * as InstantFns from 'temporal-polyfill/fns/instant'
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/zoneddatetime'

describe('timeZone', () => {
  // NOTE: Only deals with the processing of *received* events.
  // Verification of a correct AJAX *request* is done in events-json-feed.js

  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2014-05-01',
    events: [
      {
        id: '1',
        title: 'all day event',
        start: '2014-05-02',
      },
      {
        id: '2',
        title: 'timed event',
        start: '2014-05-10T12:00:00',
      },
      {
        id: '3',
        title: 'timed and zoned event',
        start: '2014-05-10T14:00:00+11:00',
      },
    ],
  })

  it('receives events correctly when local timezone', () => {
    initCalendar({
      timeZone: 'local',
    })
    expectLocalTimezone()
  })

  function expectLocalTimezone() {
    let allDayEvent = currentCalendar.getEventById('1')
    let timedEvent = currentCalendar.getEventById('2')
    let zonedEvent = currentCalendar.getEventById('3')
    expect(allDayEvent.allDay).toEqual(true)
    expect(allDayEvent.start).toEqualLocalDate('2014-05-02T00:00:00')
    expect(timedEvent.allDay).toEqual(false)
    expect(timedEvent.start).toEqualLocalDate('2014-05-10T12:00:00')
    expect(zonedEvent.allDay).toEqual(false)
    expect(zonedEvent.start).toEqualDate('2014-05-10T14:00:00+11:00')
  }

  it('receives events correctly when UTC timezone', () => {
    initCalendar({
      timeZone: 'UTC',
    })
    expectUtcTimezone()
  })

  function expectUtcTimezone() {
    let allDayEvent = currentCalendar.getEventById('1')
    let timedEvent = currentCalendar.getEventById('2')
    let zonedEvent = currentCalendar.getEventById('3')
    expect(allDayEvent.allDay).toEqual(true)
    expect(allDayEvent.start).toEqualDate('2014-05-02')
    expect(timedEvent.allDay).toEqual(false)
    expect(timedEvent.start).toEqualDate('2014-05-10T12:00:00Z')
    expect(zonedEvent.allDay).toEqual(false)
    expect(zonedEvent.start).toEqualDate('2014-05-10T14:00:00+11:00')
  }

  it('receives events correctly when custom timezone', () => {
    const timeZone = 'America/Chicago'
    initCalendar({ timeZone })
    expectCustomTimezone(timeZone)
  })

  function expectCustomTimezone(timeZone) {
    let allDayEvent = currentCalendar.getEventById('1')
    let timedEvent = currentCalendar.getEventById('2')
    let zonedEvent = currentCalendar.getEventById('3')
    expect(allDayEvent.allDay).toEqual(true)
    expect(allDayEvent.start).toEqualDate(
      new Date(
        ZonedDateTimeFns.epochMilliseconds(PlainDateFns.toZonedDateTime(PlainDateFns.fromString('2014-05-02'), timeZone)),
      )
    )
    expect(timedEvent.allDay).toEqual(false)
    expect(timedEvent.start).toEqualDate(
      new Date(
        ZonedDateTimeFns.epochMilliseconds(PlainDateTimeFns.toZonedDateTime(PlainDateTimeFns.fromString('2014-05-10T12:00:00'), timeZone)),
      )
    )
    expect(zonedEvent.allDay).toEqual(false)
    expect(zonedEvent.start).toEqualDate(
      new Date(
        InstantFns.epochMilliseconds(InstantFns.fromString('2014-05-10T14:00:00+11:00')),
      )
    )
  }

  it('can be set dynamically', () => {
    initCalendar({
      timeZone: 'local',
    })

    expectLocalTimezone()

    currentCalendar.setOption('timeZone', 'UTC')
    let allDayEvent = currentCalendar.getEventById('1')
    let timedEvent = currentCalendar.getEventById('2')
    let zonedEvent = currentCalendar.getEventById('3')
    expect(allDayEvent.allDay).toEqual(true)
    expect(allDayEvent.start).toEqualDate('2014-05-02')
    expect(timedEvent.allDay).toEqual(false)
    expect(timedEvent.start).toEqualLocalDate('2014-05-10T12:00:00') // was parsed as LOCAL originally
    expect(zonedEvent.allDay).toEqual(false)
    expect(zonedEvent.start).toEqualDate('2014-05-10T14:00:00+11:00')
  })
})
