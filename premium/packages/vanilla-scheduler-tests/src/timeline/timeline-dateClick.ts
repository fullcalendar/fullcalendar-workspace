import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('timeline dateClick', () => {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  })

  describeOptions('direction', {
    LTR: false,
    RTL: true,
  }, () => {
    describeTimeZones((tz) => {
      describe('when time scale', () => {
        pushOptions({
          initialView: 'resourceTimelineDay',
        })

        describe('when snap matches slots', () => {
          describe('when no resources', () => {
            pushOptions({
              initialView: 'timelineDay',
            })

            it('reports date with no resource', async () => {
              let dateClickCalled = false
              let clickResolve: () => void
              let clickPromise = new Promise<void>((resolve) => {
                clickResolve = resolve
              })
              let calendar = initCalendar({
                dateClick(data) {
                  dateClickCalled = true
                  expect(data.date).toEqualDate(tz.parseDate('2015-11-28T04:30:00'))
                  expect(typeof data.jsEvent).toBe('object')
                  expect(typeof data.view).toBe('object')
                  expect(data.resource).toBeFalsy()
                  clickResolve()
                },
              })

              await waitTimeout()
              let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
              await timelineGrid.clickDate('2015-11-28T04:30:00')
              await clickPromise
              expect(dateClickCalled).toBe(true)
            })
          })

          describe('when resources', () => {
            it('won\'t report anything if not clicked on resource', (done) => {
              let dateClickCalled = false
              let calendar = initCalendar({
                dateClick() {
                  dateClickCalled = true
                },
              })

              let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
              let slatEl = timelineGrid.getSlatElByDate('2015-11-28T04:30:00')
              $(slatEl).simulate('drag', {
                callback() {
                  expect(dateClickCalled).toBe(false)
                  done()
                },
              })
            })

            it('reports click on a resource', async () => {
              let dateClickCalled = false
              let clickResolve: () => void
              let clickPromise = new Promise<void>((resolve) => {
                clickResolve = resolve
              })
              let calendar = initCalendar({
                dateClick(data) {
                  dateClickCalled = true
                  expect(data.date).toEqualDate(tz.parseDate('2015-11-28T04:30:00'))
                  expect(typeof data.jsEvent).toBe('object')
                  expect(typeof data.view).toBe('object')
                  expect(data.resource.id).toBe('b')
                  clickResolve()
                },
              })

              await waitTimeout()
              let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
              await timelineGrid.click('b', '2015-11-28T04:30:00')
              await clickPromise
              expect(dateClickCalled).toBe(true)
            })
          })
        })

        describe('when snap smaller than slots', () => {
          pushOptions({
            slotDuration: '00:30',
            snapDuration: '00:15',
          })

          it('reports a smaller granularity', async () => {
            let dateClickCalled = false
            let clickResolve: () => void
            let clickPromise = new Promise<void>((resolve) => {
              clickResolve = resolve
            })
            let calendar = initCalendar({
              dateClick(data) {
                dateClickCalled = true
                expect(data.date).toEqualDate(tz.parseDate('2015-11-28T04:15:00'))
                expect(typeof data.jsEvent).toBe('object')
                expect(typeof data.view).toBe('object')
                expect(data.resource.id).toBe('b')
                clickResolve()
              },
            })

            await waitTimeout()
            let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
            await timelineGrid.click('b', '2015-11-28T04:15:00')
            await clickPromise
            expect(dateClickCalled).toBe(true)
          })
        })
      })
    })

    describe('when day scale', () => {
      pushOptions({
        initialView: 'resourceTimelineMonth',
        slotDuration: { days: 1 },
      })

      it('reports untimed dates', async () => {
        let dateClickCalled = false
        let clickResolve: () => void
        let clickPromise = new Promise<void>((resolve) => {
          clickResolve = resolve
        })
        let calendar = initCalendar({
          dateClick(data) {
            dateClickCalled = true
            expect(data.date).toEqualDate('2015-11-03')
            expect(typeof data.jsEvent).toBe('object')
            expect(typeof data.view).toBe('object')
            expect(data.resource.id).toBe('a')
            clickResolve()
          },
        })

        await waitTimeout()
        let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
        await timelineGrid.click('a', '2015-11-03')
        await clickPromise
        expect(dateClickCalled).toBe(true)
      })
    })

    describe('when week scale', () => {
      pushOptions({
        initialView: 'resourceTimelineYear',
        slotDuration: { weeks: 1 },
      })

      it('reports untimed dates', async () => {
        let dateClickCalled = false
        let clickResolve: () => void
        let clickPromise = new Promise<void>((resolve) => {
          clickResolve = resolve
        })
        let calendar = initCalendar({
          dateClick(data) {
            dateClickCalled = true
            expect(data.date).toEqualDate('2015-01-18')
            expect(typeof data.jsEvent).toBe('object')
            expect(typeof data.view).toBe('object')
            expect(data.resource.id).toBe('a')
            clickResolve()
          },
        })

        await waitTimeout()
        let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
        await timelineGrid.click('a', '2015-01-18')
        await clickPromise
        expect(dateClickCalled).toBe(true)
      })
    })
  })
})
