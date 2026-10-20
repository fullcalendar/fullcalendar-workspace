import { createElement } from 'fullcalendar/preact'
import { useHitTarget } from 'fullcalendar/protected-api'
import { DEFAULT_PLUGINS } from '../lib/global-plugins'
import { waitTimeout } from '../lib/misc'

/*
useHitTarget has no built-in users until the layouts convert (planning/refactor-roadmap.md phases
5 and 7), so a custom view stands in for one
*/
describe('useHitTarget', () => {
  let elRef: { current: HTMLElement | null } = { current: null }

  // one day-wide hit, for the current date range. the root element's tag alternates by week
  function HitView(props: { dateProfile: any }) {
    let { dateProfile } = props

    useHitTarget(elRef, {
      queryHit(isRtl, positionLeft, positionTop, elWidth, elHeight) {
        return {
          dateProfile,
          dateSpan: { range: dateProfile.currentRange, allDay: true },
          getDayEl: () => elRef.current,
          rect: { left: 0, right: elWidth, top: 0, bottom: elHeight },
          layer: 0,
        }
      },
    })

    let weekIndex = Math.floor(dateProfile.currentRange.start.valueOf() / (7 * 24 * 60 * 60 * 1000))

    return createElement(weekIndex % 2 ? 'section' : 'div', {
      ref: elRef,
      className: 'hit-view',
      style: { height: '100px' },
    })
  }

  pushOptions({
    plugins: [
      ...DEFAULT_PLUGINS,
      {
        name: 'hit-view',
        views: {
          hitView: {
            duration: { days: 1 },
            content: (info: any) => createElement(HitView, { dateProfile: info.dateProfile }),
          },
        },
      },
    ],
    initialView: 'hitView',
    initialDate: '2024-01-04', // a Thursday. weeks since the epoch start on Thursdays
  })

  it('reports a date click with the latest queryHit', async () => {
    let clickedDates: string[] = []
    let calendar = initCalendar({
      dateClick(info) {
        clickedDates.push(info.dateStr)
      },
    })

    calendar.next() // same week, same element
    await waitTimeout()
    $.simulateMouseClick(elRef.current)
    await waitTimeout()

    expect(clickedDates).toEqual(['2024-01-05'])
  })

  it('follows the element when it changes', async () => {
    let clickedDates: string[] = []
    let calendar = initCalendar({
      dateClick(info) {
        clickedDates.push(info.dateStr)
      },
    })
    let firstEl = elRef.current

    calendar.gotoDate('2024-01-11') // another week, so the root element's tag changes
    await waitTimeout()
    expect(elRef.current).not.toBe(firstEl) // sanity check
    $.simulateMouseClick(elRef.current)
    await waitTimeout()

    expect(clickedDates).toEqual(['2024-01-11'])
  })
})
