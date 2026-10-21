import { DEFAULT_PLUGINS } from '../lib/global-plugins'

/*
The store's actions are what changes a calendar; the API's methods delegate to them, and a driver's
overridable methods (batchRendering) are still called through the API (planning/phase-9-store.md)
*/
describe('calendar store actions', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2024-01-10',
  })

  it('are what the API methods run', () => {
    let calendar = initCalendar()
    let actions = calendar.store.actions as any
    let names = [
      'changeView', 'zoomTo', 'prev', 'next', 'prevYear', 'nextYear', 'today', 'gotoDate', 'incrementDate',
      'setOption', 'select', 'unselect', 'addEvent', 'removeAllEvents', 'addEventSource',
      'removeAllEventSources', 'refetchEvents', 'scrollToTime',
    ]

    for (let name of names) {
      spyOn(actions, name)
    }

    calendar.changeView('dayGridWeek')
    calendar.zoomTo(new Date(), 'day')
    calendar.prev()
    calendar.next()
    calendar.prevYear()
    calendar.nextYear()
    calendar.today()
    calendar.gotoDate('2024-02-01')
    calendar.incrementDate({ days: 1 })
    calendar.setOption('weekends', false)
    calendar.select('2024-01-10')
    calendar.unselect()
    calendar.addEvent({ start: '2024-01-10' })
    calendar.removeAllEvents()
    calendar.addEventSource([])
    calendar.removeAllEventSources()
    calendar.refetchEvents()
    calendar.scrollToTime('01:00')

    for (let name of names) {
      expect(actions[name]).toHaveBeenCalledTimes(1)
    }
  })

  it('change the calendar as the API did', () => {
    let calendar = initCalendar()

    calendar.store.actions.next()
    expect(calendar.getDate().toISOString().slice(0, 10)).toBe('2024-02-01')

    let event = calendar.store.actions.addEvent({ title: 'a', start: '2024-02-10' })
    expect(calendar.getEvents().map((otherEvent) => otherEvent.title)).toEqual(['a'])
    expect(event.title).toBe('a')
  })

  it('call the driver\'s batchRendering for a view change', () => {
    let calendar = initCalendar()
    let batchRenderingSpy = spyOn(calendar, 'batchRendering').and.callThrough()

    calendar.store.actions.changeView('dayGridWeek')
    expect(batchRenderingSpy).toHaveBeenCalledTimes(1)
    expect(calendar.view.type).toBe('dayGridWeek')
  })

  it('are what the event and event source wrappers run', () => {
    let calendar = initCalendar({
      eventSources: [{ id: 's', events: [{ id: 'e', title: 'a', start: '2024-01-10' }] }],
    })
    let actions = calendar.store.actions as any
    let names = ['mutateEvent', 'removeEvent', 'removeEventSource', 'refetchEventSource']

    for (let name of names) {
      spyOn(actions, name).and.callThrough()
    }

    let event = calendar.getEventById('e')
    let source = calendar.getEventSourceById('s')
    event.setProp('title', 'b')
    event.remove()
    source.refetch()
    source.remove()

    for (let name of names) {
      expect(actions[name]).toHaveBeenCalledTimes(1)
    }
  })

  it('mutate an event as EventImpl did: the wrapper updates, and eventChange can revert', () => {
    let changeArgs = []
    let calendar = initCalendar({
      events: [{ id: 'e', title: 'a', start: '2024-01-10' }],
      eventChange(arg) {
        changeArgs.push(arg)
      },
    })
    let event = calendar.getEventById('e')

    event.setProp('title', 'b')
    expect(event.title).toBe('b')
    expect(calendar.getEventById('e').title).toBe('b')
    expect(changeArgs.length).toBe(1)
    expect(changeArgs[0].oldEvent.title).toBe('a')
    expect(changeArgs[0].event).toBe(event)

    changeArgs[0].revert()
    expect(calendar.getEventById('e').title).toBe('a')
  })

  describe('overrides', () => {
    it('of the API\'s unselect still apply to navigation', () => {
      let calendar = initCalendar()
      let unselectSpy = spyOn(calendar, 'unselect').and.callThrough()

      calendar.next()
      calendar.today()
      calendar.changeView('dayGridWeek')
      expect(unselectSpy).toHaveBeenCalledTimes(3)
    })

    it('by a plugin\'s action apply to the API and to navigation', () => {
      let unselectCnt = 0
      let calendar = initCalendar({
        plugins: [...DEFAULT_PLUGINS, {
          name: 'override-unselect',
          calendarActions: () => ({
            unselect() {
              unselectCnt++
            },
          }),
        }],
      })

      calendar.unselect()
      calendar.next()
      expect(unselectCnt).toBe(2)
    })

    it('can wrap the action they replace', () => {
      let log = []
      let calendar = initCalendar({
        plugins: [...DEFAULT_PLUGINS, {
          name: 'wrap-next',
          calendarActions: (store, _calendarApi, baseActions) => {
            let actionsDuringBuild = store.actions // reading them while they're built doesn't recurse
            expect(actionsDuringBuild).toBeTruthy()
            return {
              next() {
                log.push('plugin')
                baseActions.next()
              },
            }
          },
        }],
      })

      calendar.next()
      expect(log).toEqual(['plugin'])
      expect(calendar.getDate().toISOString().slice(0, 10)).toBe('2024-02-01')
    })
  })

  describe('lifecycle', () => {
    let extraPlugin = {
      name: 'extra-action',
      calendarActions: () => ({
        extra() {
          return 'extra'
        },
      }),
    }

    it('are the same object while the plugins don\'t change, and rebuilt when they do', () => {
      let calendar = initCalendar({ plugins: [...DEFAULT_PLUGINS, extraPlugin] })
      let actions = calendar.store.actions
      expect(calendar.store.actions).toBe(actions)
      expect((actions as any).extra()).toBe('extra')

      calendar.next()
      expect(calendar.store.actions).toBe(actions)

      calendar.resetOptions({
        plugins: DEFAULT_PLUGINS,
        initialView: 'dayGridMonth',
        initialDate: '2024-01-10',
      })
      expect(calendar.store.actions).not.toBe(actions)
      expect((calendar.store.actions as any).extra).toBeUndefined()
    })

    it('are what resetOptions runs', () => {
      let calendar = initCalendar()
      let resetSpy = spyOn(calendar.store.actions, 'resetOptions').and.callThrough()

      calendar.resetOptions({ weekends: false }, ['weekends'])
      expect(resetSpy).toHaveBeenCalledTimes(1)
      expect(calendar.getOption('weekends')).toBe(false)
    })

    it('of new plugins are visible to their own option refiners', () => {
      let seenExtra
      let calendar = initCalendar()

      calendar.resetOptions({
        plugins: [...DEFAULT_PLUGINS, {
          ...extraPlugin,
          optionRefiners: {
            extraOption(input) {
              seenExtra = (calendar.store.actions as any).extra
              return input
            },
          },
        }],
        initialView: 'dayGridMonth',
        initialDate: '2024-01-10',
        extraOption: true,
      } as any)
      expect(typeof seenExtra).toBe('function')
    })

    it('propagate a creator\'s error to the API call, and build again after', () => {
      let shouldThrow = true
      let calendar = initCalendar({
        plugins: [...DEFAULT_PLUGINS, {
          name: 'throwing-creator',
          calendarActions: () => {
            if (shouldThrow) {
              throw new Error('creator failed')
            }
            return {}
          },
        }],
      })

      expect(() => calendar.next()).toThrowError('creator failed')
      shouldThrow = false
      calendar.next()
      expect(calendar.getDate().toISOString().slice(0, 10)).toBe('2024-02-01')
    })
  })
})
