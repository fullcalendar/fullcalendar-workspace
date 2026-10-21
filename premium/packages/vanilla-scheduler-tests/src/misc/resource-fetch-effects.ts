import scrollGridPlugin from 'fullcalendar-scheduler/scrollgrid'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'
import { DEFAULT_PLUGINS } from '@fullcalendar-tests/standard/lib/global-plugins'
import themeForTestsPremiumPlugin from '../lib/theme-for-tests-premium'

/*
The resource reducer describes fetches as effects; a runner performs them (planning/phase-9-store.md).
A test plugin's runner records them instead, proving the reducer never fetches on its own
*/
describe('resource fetch effects', () => {
  it('are the only way a resource source is fetched', () => {
    let effects = []
    let fetchCnt = 0
    let calendar = initCalendar({
      plugins: [
        ...DEFAULT_PLUGINS,
        scrollGridPlugin,
        resourceTimelinePlugin,
        themeForTestsPremiumPlugin,
        {
          name: 'record-resource-fetch-effects',
          effectRunners: {
            fetchResourceSource: (effect) => {
              effects.push(effect)
            },
          },
        },
      ],
      initialView: 'resourceTimelineDay',
      resources(_info, successCallback) {
        fetchCnt++
        successCallback([])
      },
    })

    expect(fetchCnt).toBe(0)
    expect(effects.length).toBe(1)
    expect(effects[0].type).toBe('fetchResourceSource')

    effects.length = 0
    calendar.refetchResources()
    expect(fetchCnt).toBe(0)
    expect(effects.length).toBe(1)
  })
})
