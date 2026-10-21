import { CalendarApiImpl, createCalendarStore } from 'fullcalendar/protected-api'
import { DEFAULT_PLUGINS } from '../lib/global-plugins'

/*
The store notifies its subscribers once per drain that completed actions, after it settles, with what
the drain completed (planning/phase-9-store.md, the store)
*/
describe('calendar store subscribe', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2024-01-10',
  })

  function subscribe(calendar) {
    let changes = []
    let data = []
    calendar.store.subscribe((change) => {
      changes.push(change)
      data.push(calendar.store.getData())
    })
    return { changes, data }
  }

  it('notifies once per drain, with all its completed actions', () => {
    let calendar = initCalendar({
      events: (_info, successCallback) => successCallback([]),
    })
    let { changes, data } = subscribe(calendar)

    calendar.next() // the source's synchronous result is received in the same drain
    expect(changes.length).toBe(1)
    expect(changes[0].completedActions.map((action) => action.type)).toEqual(['NEXT', 'RECEIVE_EVENTS'])
    expect(changes[0].isUrgent).toBe(false)
    expect(changes[0].isInCommit).toBe(false)
    expect(data[0]).toBe(calendar.getCurrentData())
    expect(data[0].currentDate.toISOString().slice(0, 10)).toBe('2024-02-01')
  })

  it('marks drags, resizes and merges as urgent', () => {
    let calendar = initCalendar()
    let { changes } = subscribe(calendar)

    calendar.dispatch({ type: 'SET_EVENT_DRAG', state: { affectedEvents: { defs: {}, instances: {} }, mutatedEvents: { defs: {}, instances: {} }, isEvent: true } })
    calendar.dispatch({ type: 'UNSET_EVENT_DRAG' })
    calendar.dispatch({ type: 'SET_EVENT_RESIZE', state: { affectedEvents: { defs: {}, instances: {} }, mutatedEvents: { defs: {}, instances: {} }, isEvent: true } })
    calendar.dispatch({ type: 'UNSET_EVENT_RESIZE' })
    calendar.dispatch({ type: 'MERGE_EVENTS', eventStore: { defs: {}, instances: {} } })
    calendar.dispatch({ type: 'UNSELECT_DATES' })
    expect(changes.map((change) => change.isUrgent)).toEqual([true, true, true, true, true, false])
  })

  it('stops notifying after unsubscribing', () => {
    let calendar = initCalendar()
    let cnt = 0
    let unsubscribe = calendar.store.subscribe(() => {
      cnt++
    })

    calendar.next()
    unsubscribe()
    calendar.next()
    expect(cnt).toBe(1)
  })

  // a mount-gated store, as React's driver makes, subscribed before its first update
  describe('when mount-gated', () => {
    let store
    let changes

    beforeEach(() => {
      store = createCalendarStore({ calendarApi: new CalendarApiImpl(), isMountGated: true })
      changes = []
      store.subscribe((change) => {
        changes.push(change)
      })
    })

    afterEach(() => {
      store.destroy()
    })

    const options = {
      plugins: DEFAULT_PLUGINS,
      initialView: 'dayGridMonth',
      initialDate: '2024-01-10',
    }

    it('does not notify for initialization, idle drains or render-time drains', () => {
      // a synchronous source, so initialization also completes a RECEIVE_EVENTS
      let sourceOptions = { ...options, events: (_info, successCallback) => successCallback([]) }
      store.update(sourceOptions) // initialization
      store.update(sourceOptions) // only IDLE
      store.mount()
      store.update(sourceOptions)
      // the events option's change handler dispatches, so this render-time drain completes actions
      store.update({ ...sourceOptions, events: (_info, successCallback) => successCallback([]) }, /* isRendering = */ true)
      store.flushEffects()
      expect(changes.length).toBe(0)
    })

    it('holds changes while not mounted, and delivers them together on mount', () => {
      store.update(options, true)
      store.dispatch({ type: 'NEXT' })
      store.dispatch({ type: 'MERGE_EVENTS', eventStore: { defs: {}, instances: {} } })
      expect(changes.length).toBe(0)

      store.mount()
      expect(changes.length).toBe(1)
      expect(changes[0].completedActions.map((action) => action.type)).toEqual(['NEXT', 'MERGE_EVENTS'])
      expect(changes[0].isUrgent).toBe(true)
      expect(changes[0].isInCommit).toBe(true)

      store.dispatch({ type: 'PREV' })
      expect(changes.length).toBe(2)
      expect(changes[1].isInCommit).toBe(false)
    })

    it('holds changes again after unmounting', () => {
      store.update(options, true)
      store.mount()
      store.unmount()
      store.dispatch({ type: 'NEXT' })
      expect(changes.length).toBe(0)

      store.mount()
      expect(changes.map((change) => change.completedActions[0].type)).toEqual(['NEXT'])
    })
  })
})
