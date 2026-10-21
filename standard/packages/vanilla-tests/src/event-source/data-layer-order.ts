import { waitTimeout } from '../lib/misc'

/*
Behavior locks for phase 9 (planning/phase-9-store.md), which restructures the data layer without
changing what's observable. These record today's ordering: when synchronous sources resolve, what
loading reports, when API reads see new state, and how option resets apply mid-dispatch
*/
describe('data layer ordering', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2024-01-10',
  })

  describe('a synchronous function source', () => {
    it('gives the first eventsSet its events', () => {
      let eventsSetCounts: number[] = []

      initCalendar({
        events(_info, successCallback) {
          successCallback([{ title: 'a', start: '2024-01-10' }])
        },
        eventsSet(events) {
          eventsSetCounts.push(events.length)
        },
      })

      expect(eventsSetCounts).toEqual([1])
    })

    it('reads the previous date when called during navigation', () => {
      let datesRead: string[] = []
      let calendar
      calendar = initCalendar({
        events(_info, successCallback) {
          datesRead.push(calendar ? calendar.getDate().toISOString().slice(0, 10) : 'init')
          successCallback([])
        },
      })

      calendar.next()
      expect(datesRead).toEqual(['init', '2024-01-10'])
    })
  })

  describe('loading', () => {
    it('reports an array source, though it resolves at once', () => {
      let loadings: boolean[] = []

      initCalendar({
        events: [{ title: 'a', start: '2024-01-10' }],
        loading(isLoading) {
          loadings.push(isLoading)
        },
      })

      expect(loadings).toEqual([true, false])
    })

    it('reports an async source', async () => {
      let loadings: boolean[] = []

      initCalendar({
        events(_info, successCallback) {
          setTimeout(() => successCallback([]))
        },
        loading(isLoading) {
          loadings.push(isLoading)
        },
      })

      await waitTimeout(50)
      expect(loadings).toEqual([true, false])
    })

    it('reports a settled async source refetching for a time zone change', async () => {
      let loadings: boolean[] = []
      let calendar = initCalendar({
        timeZone: 'UTC',
        events(_info, successCallback) {
          setTimeout(() => successCallback([]))
        },
        loading(isLoading) {
          loadings.push(isLoading)
        },
      })

      await waitTimeout(50)
      loadings = []
      calendar.setOption('timeZone', 'local')
      await waitTimeout(50)
      // only the end: the refetch is marked after the loading transition was captured
      expect(loadings).toEqual([false])
    })
  })

  describe('resetOptions', () => {
    it('refines a named option again when the same object was mutated (Vue)', () => {
      let events = [{ title: 'a', start: '2024-01-10' }]
      let options = { events }
      let calendar = initCalendar(options)

      events.push({ title: 'b', start: '2024-01-11' })
      ;(calendar as any).resetOptions(options, ['events'])

      expect(calendar.getEvents().map((event) => event.title).sort()).toEqual(['a', 'b'])
    })

    it('applies a reset made by a source mid-dispatch to events already received', () => {
      let shouldReset = false
      let calendar = initCalendar({
        eventSources: [
          (_info, successCallback) => {
            successCallback([{ title: 'a', start: '2024-01-10' }])
          },
          (_info, successCallback) => {
            if (shouldReset) {
              shouldReset = false
              ;(calendar as any).resetOptions({
                eventDataTransform: (input) => ({ ...input, title: input.title + '!' }),
              }, ['eventDataTransform'])
            }
            successCallback([{ title: 'b', start: '2024-01-11' }])
          },
        ],
      })

      shouldReset = true
      calendar.refetchEvents()

      expect(calendar.getEvents().map((event) => event.title).sort()).toEqual(['a!', 'b!'])
    })
  })
})
