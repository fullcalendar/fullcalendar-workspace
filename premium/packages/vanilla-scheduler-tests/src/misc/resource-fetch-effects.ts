import scrollGridPlugin from 'fullcalendar-scheduler/scrollgrid'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'
import { DEFAULT_PLUGINS } from '@fullcalendar-tests/standard/lib/global-plugins'
import themeForTestsPremiumPlugin from '../lib/theme-for-tests-premium'

/*
The resource reducer describes fetches as effects; a runner performs them (planning/phase-9-store.md).
A test plugin's runner records them instead, proving the reducer never fetches on its own
*/
describe('resource fetch effects', () => {
  // the resource plugin's runner, found through the view plugin's dependencies
  function findResourceRunner(plugin: any): any {
    if (plugin.effectRunners && plugin.effectRunners.fetchResourceSource) {
      return plugin.effectRunners.fetchResourceSource
    }
    for (let dep of plugin.deps || []) {
      let runner = findResourceRunner(dep)
      if (runner) {
        return runner
      }
    }
    return null
  }

  function buildPlugins(effects: any[], isPassThrough = false) {
    let resourceRunner = findResourceRunner(resourceTimelinePlugin)

    return [
      ...DEFAULT_PLUGINS,
      scrollGridPlugin,
      resourceTimelinePlugin,
      themeForTestsPremiumPlugin,
      {
        name: 'record-resource-fetch-effects',
        effectRunners: {
          fetchResourceSource: (effect) => {
            effects.push(effect)

            if (isPassThrough) {
              resourceRunner(effect)
            }
          },
        },
      },
    ]
  }

  it('are the only way a resource source is fetched', () => {
    let effects = []
    let fetchCnt = 0
    let calendar = initCalendar({
      plugins: buildPlugins(effects),
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

  it('describe a fetch on navigation with refetchResourcesOnNavigate', () => {
    let effects = []
    let calendar = initCalendar({
      plugins: buildPlugins(effects, true),
      initialView: 'resourceTimelineDay',
      refetchResourcesOnNavigate: true,
      resources: (_info, successCallback) => successCallback([]),
    })
    let prevSource = calendar.getCurrentData().resourceSource

    effects.length = 0
    calendar.next()
    expect(effects.length).toBe(1)
    expect(effects[0].resourceSource).toBe(prevSource) // as it was, marked fetching after
    expect(calendar.getCurrentData().resourceSource.latestFetchId).toBe(effects[0].fetchId)

    // the same range
    effects.length = 0
    calendar.changeView('resourceTimelineDay')
    expect(effects.length).toBe(0)
  })

  it('describe no fetch on navigation without refetchResourcesOnNavigate', () => {
    let effects = []
    let calendar = initCalendar({
      plugins: buildPlugins(effects),
      initialView: 'resourceTimelineDay',
      resources: (_info, successCallback) => successCallback([]),
    })

    effects.length = 0
    calendar.next()
    expect(effects.length).toBe(0)
  })
})
