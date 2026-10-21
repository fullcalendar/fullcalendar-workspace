import { runEventSourceFetch } from 'fullcalendar/protected-api'
import { DEFAULT_PLUGINS } from '../lib/global-plugins'

/*
The reducers describe fetches as effects; a runner performs them (planning/phase-9-store.md). A test
plugin's runner records them instead, proving the reducers never fetch on their own, or records them and
passes them on to the core's runner, for the order and the sources' state at each fetch
*/
describe('event source fetch effects', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2024-01-10',
  })

  function buildRecordingPlugin(effects: any[], isPassThrough = false) {
    return {
      name: 'record-fetch-effects',
      effectRunners: {
        fetchEventSource: (effect) => {
          effects.push(effect)

          if (isPassThrough) {
            runEventSourceFetch(effect)
          }
        },
      },
    }
  }

  it('are the only way a source is fetched', () => {
    let effects = []
    let fetchCnt = 0

    initCalendar({
      plugins: [...DEFAULT_PLUGINS, buildRecordingPlugin(effects)],
      events(_info, successCallback) {
        fetchCnt++
        successCallback([])
      },
    })

    expect(fetchCnt).toBe(0)
    expect(effects.length).toBe(1)
    expect(effects[0].type).toBe('fetchEventSource')
    expect(typeof effects[0].fetchId).toBe('string')
  })

  it('describe one fetch per dirty source on navigation', () => {
    let effects = []
    let calendar = initCalendar({
      plugins: [...DEFAULT_PLUGINS, buildRecordingPlugin(effects)],
      eventSources: [
        (_info, successCallback) => successCallback([]),
        (_info, successCallback) => successCallback([]),
      ],
    })

    effects.length = 0
    calendar.next()
    expect(effects.length).toBe(2)
  })

  it('give each fetch the source as it was, and mark it fetching after', () => {
    let effects = []
    let calendar = initCalendar({
      plugins: [...DEFAULT_PLUGINS, buildRecordingPlugin(effects, true)],
      eventSources: [
        (_info, successCallback) => successCallback([]),
        (_info, successCallback) => successCallback([]),
      ],
    })
    let prevSources = calendar.getCurrentData().eventSources

    effects.length = 0
    calendar.next()
    expect(effects.length).toBe(2)

    let sources = calendar.getCurrentData().eventSources
    for (let effect of effects) {
      let { sourceId } = effect.eventSource
      expect(effect.eventSource).toBe(prevSources[sourceId])
      expect(effect.eventSource.latestFetchId).not.toBe(effect.fetchId)
      expect(sources[sourceId].latestFetchId).toBe(effect.fetchId)
    }
  })

  // ids come from one counter: an event the first source adds while it's fetched gets an id between
  // the two fetches' ids only if the second fetch id is allocated after the first fetch ran
  it('fetch one source at a time', () => {
    let effects = []
    let isNavigating = false
    let addedEvent = null
    let calendar
    calendar = initCalendar({
      plugins: [...DEFAULT_PLUGINS, buildRecordingPlugin(effects, true)],
      eventSources: [
        (_info, successCallback) => {
          if (isNavigating && !addedEvent) {
            addedEvent = calendar.addEvent({ title: 'added', start: '2024-02-10' })
          }
          successCallback([])
        },
        (_info, successCallback) => successCallback([]),
      ],
    })

    effects.length = 0
    isNavigating = true
    calendar.next()
    expect(effects.length).toBe(2)
    expect(addedEvent).toBeTruthy()

    let addedId = Number(addedEvent._def.defId)
    expect(Number(effects[0].fetchId)).toBeLessThan(addedId)
    expect(addedId).toBeLessThan(Number(effects[1].fetchId))
  })

  it('skip clean sources', () => {
    let effects = []
    let calendar = initCalendar({
      plugins: [...DEFAULT_PLUGINS, buildRecordingPlugin(effects, true)],
      eventSources: [
        [{ title: 'static', start: '2024-01-10' }],
        (_info, successCallback) => successCallback([]),
      ],
    })

    // within the range the function source has
    effects.length = 0
    calendar.changeView('dayGridWeek')
    expect(effects.length).toBe(0)

    // outside it. the array source never refetches
    calendar.gotoDate('2024-03-10')
    expect(effects.length).toBe(1)
    expect(effects[0].eventSource.meta).toEqual(jasmine.any(Function))
  })

  it('refetch non-static sources after a time zone change', () => {
    let effects = []
    let calendar = initCalendar({
      plugins: [...DEFAULT_PLUGINS, buildRecordingPlugin(effects, true)],
      timeZone: 'UTC',
      eventSources: [
        [{ title: 'static', start: '2024-01-10' }],
        (_info, successCallback) => successCallback([]),
      ],
    })
    let prevSources = calendar.getCurrentData().eventSources

    effects.length = 0
    calendar.setOption('timeZone', 'America/New_York')
    expect(effects.length).toBe(1)
    expect(effects[0].isRefetch).toBe(true)
    expect(effects[0].eventSource).toBe(prevSources[effects[0].eventSource.sourceId])
  })

  it('are how option change handlers run', () => {
    let effects = []
    let calendar = initCalendar({
      plugins: [...DEFAULT_PLUGINS, {
        name: 'record-option-change-effects',
        effectRunners: {
          optionChange: (effect) => {
            effects.push(effect)
          },
        },
      }],
      events: [{ title: 'a', start: '2024-01-10' }],
    })

    calendar.setOption('events', [{ title: 'b', start: '2024-01-10' }])
    expect(effects.map((effect) => effect.optionName)).toEqual(['events'])
    expect(effects[0].data.calendarOptions.events).toBe(effects[0].optionValue)
    expect(calendar.getEvents().map((event) => event.title)).toEqual(['a']) // the handler didn't run
  })
})
