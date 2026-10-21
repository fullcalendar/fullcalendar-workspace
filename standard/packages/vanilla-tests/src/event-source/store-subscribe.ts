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

    calendar.dispatch({ type: 'UNSET_EVENT_DRAG' })
    calendar.dispatch({ type: 'UNSET_EVENT_RESIZE' })
    calendar.dispatch({ type: 'UNSELECT_DATES' })
    expect(changes.map((change) => change.isUrgent)).toEqual([true, true, false])
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
})
