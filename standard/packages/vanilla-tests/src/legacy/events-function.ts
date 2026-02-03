import { plainAndZoneToString, plainAndZoneToDate } from "../lib/temporal-convert"

describe('events as a function', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2014-05-01',
  })

  function testEventFunctionParams(data, callback) {
    expect(data.start instanceof Date).toEqual(true)
    expect(data.end instanceof Date).toEqual(true)
    expect(typeof callback).toEqual('function')
  }

  it('requests correctly when local timezone', (done) => {
    initCalendar({
      timeZone: 'local',
      events(data, callback) {
        testEventFunctionParams(data, callback)
        expect(data.timeZone).toEqual('local')
        expect(data.start).toEqualLocalDate('2014-04-27T00:00:00')
        expect(data.startStr).toMatch(/^2014-04-27T00:00:00[-+]/)
        expect(data.end).toEqualLocalDate('2014-06-08T00:00:00')
        expect(data.endStr).toMatch(/^2014-06-08T00:00:00[-+]/)
        callback([])
        setTimeout(done) // :(
      },
    })
  })

  it('requests correctly when UTC timezone', (done) => {
    initCalendar({
      timeZone: 'UTC',
      events(data, callback) {
        testEventFunctionParams(data, callback)
        expect(data.timeZone).toEqual('UTC')
        expect(data.start).toEqualDate('2014-04-27T00:00:00Z')
        expect(data.startStr).toEqual('2014-04-27T00:00:00Z')
        expect(data.end).toEqualDate('2014-06-08T00:00:00Z')
        expect(data.endStr).toEqual('2014-06-08T00:00:00Z')
        callback([])
        setTimeout(done) // :(
      },
    })
  })

  it('requests correctly when custom timezone', (done) => {
    const timeZone = 'America/Chicago'
    initCalendar({
      timeZone,
      events(data, callback) {
        testEventFunctionParams(data, callback)
        expect(data.timeZone).toEqual(timeZone)
        expect(data.start).toEqualDate(plainAndZoneToDate('2014-04-27T00:00:00', timeZone))
        expect(data.startStr).toEqual(plainAndZoneToString('2014-04-27T00:00:00', timeZone))
        expect(data.end).toEqualDate(plainAndZoneToDate('2014-06-08T00:00:00', timeZone))
        expect(data.endStr).toEqual(plainAndZoneToString('2014-06-08T00:00:00', timeZone))
        callback([])
        setTimeout(done) // :(
      },
    })
  })

  it('requests correctly when timezone changed dynamically', (done) => {
    const timeZone = 'America/Chicago'
    let callCnt = 0
    let options = {
      timeZone,
      events(data, callback) {
        testEventFunctionParams(data, callback)
        callCnt += 1
        if (callCnt === 1) {
          expect(data.timeZone).toEqual(timeZone)
          expect(data.start).toEqualDate(plainAndZoneToDate('2014-04-27', timeZone))
          expect(data.end).toEqualDate(plainAndZoneToDate('2014-06-08', timeZone))
          setTimeout(() => {
            currentCalendar.setOption('timeZone', 'UTC')
          }, 0)
        } else if (callCnt === 2) {
          expect(data.timeZone).toEqual('UTC')
          expect(data.start).toEqualDate(plainAndZoneToDate('2014-04-27', 'UTC'))
          expect(data.end).toEqualDate(plainAndZoneToDate('2014-06-08', 'UTC'))
          setTimeout(done) // :(
        }
      },
    }

    initCalendar(options)
  })

  it('requests correctly with event source extended form', (done) => {
    let eventSource = {
      className: 'customeventclass',
      events(data, callback) {
        testEventFunctionParams(data, callback)
        expect(data.timeZone).toEqual('UTC')
        expect(data.start).toEqualDate('2014-04-27')
        expect(data.end).toEqualDate('2014-06-08')
        callback([
          {
            title: 'event1',
            start: '2014-05-10',
          },
        ])
      },
    }
    spyOn(eventSource, 'events').and.callThrough()

    initCalendar({
      timeZone: 'UTC',
      eventSources: [eventSource],
      eventDidMount(data) {
        expect(eventSource.events.calls.count()).toEqual(1)
        expect(data.el).toHaveClass('customeventclass')
        setTimeout(done) // :(
      },
    })
  })

  it('can return a promise-like object', (done) => {
    let calendar = initCalendar({
      events() {
        let deferred = $.Deferred() // we want tests to run in IE11, which doesn't have native promises
        setTimeout(() => {
          deferred.resolve([
            { start: '2018-09-04' },
          ])
        }, 100)
        return deferred.promise()
      },
    })

    setTimeout(() => {
      expect(calendar.getEvents().length).toBe(1)
      setTimeout(done) // :(
    }, 101)
  })
})
