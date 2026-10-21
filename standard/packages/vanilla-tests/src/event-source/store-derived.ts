import { DEFAULT_PLUGINS } from '../lib/global-plugins'

/*
eventUiBases, selectionConfig and businessHours are memoized derivations, not slices: in the data
(store.getData(), what renders), and given to plugin reducers, but not in store.getState()
(planning/phase-9-store.md)
*/
describe('calendar store derived data', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2024-01-10',
  })

  const DERIVED = ['eventUiBases', 'selectionConfig', 'businessHours']

  it('is in the data, not the state', () => {
    let calendar = initCalendar({ businessHours: true })
    let state = calendar.store.getState()
    let data = calendar.store.getData()

    for (let name of DERIVED) {
      expect(name in state).toBe(false)
      expect(data[name]).toBeTruthy()
    }
  })

  it('keeps its identities while its inputs don\'t change', () => {
    let calendar = initCalendar({ businessHours: true })
    let data0 = calendar.store.getData()

    calendar.next()
    let data1 = calendar.store.getData()

    for (let name of DERIVED) {
      expect(data1[name]).toBe(data0[name])
    }

    calendar.setOption('businessHours', { daysOfWeek: [1, 2] })
    expect(calendar.store.getData().businessHours).not.toBe(data0.businessHours)
  })

  it('is given to plugin reducers', () => {
    let seen = []
    initCalendar({
      plugins: [...DEFAULT_PLUGINS, {
        name: 'read-derived',
        reducers: [(_state, _action, context) => {
          seen.push(DERIVED.every((name) => context[name] !== undefined))
          return {}
        }],
      }],
    })

    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every(Boolean)).toBe(true)
  })
})
