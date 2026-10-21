import { DEFAULT_PLUGINS } from '../lib/global-plugins'

/*
The reducers describe fetches as effects; a runner performs them (planning/phase-9-store.md). A test
plugin's runner records them instead, proving the reducers never fetch on their own
*/
describe('event source fetch effects', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2024-01-10',
  })

  function buildRecordingPlugin(effects: any[]) {
    return {
      name: 'record-fetch-effects',
      effectRunners: {
        fetchEventSource: (effect) => {
          effects.push(effect)
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
})
