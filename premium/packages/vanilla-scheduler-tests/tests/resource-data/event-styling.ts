import { describe, expect, it } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { getEventEls } from '@fullcalendar-tests/standard/tests/lib/models/events'

/*
A resource's eventColor/eventContrastColor/eventClass style the events assigned to it.
With resource columns or lanes, each rendered copy takes its own resource's styling. Without them,
the single rendered event takes the styling of its first resource, and the classes of all of them.
*/
describe('event styling from resources', () => {
  const RED = 'rgba(255, 0, 0, 0.5)'
  const GREEN = 'rgba(0, 255, 0, 0.5)'
  const BLUE = 'rgba(0, 0, 255, 0.5)'

  const options = {
    now: '2016-02-14',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A', eventClass: 're1', eventColor: RED, eventContrastColor: BLUE },
      { id: 'b', title: 'Resource B', eventClass: 're2 re3', eventColor: GREEN, eventContrastColor: BLUE },
    ],
  }

  function getResourceClasses(el: HTMLElement): string[] {
    return Array.from(el.classList).filter((className) => /^re\d$/.test(className)).sort()
  }

  function getStyling(initialView: string, resourceProps: object) {
    const calendar = initCalendar({
      ...options,
      initialView,
      events: [{ id: '1', title: 'event 1', start: '2016-02-14T01:00:00', ...resourceProps }],
    })

    return getEventEls(calendar.el, '1').map((el) => ({
      backgroundColor: getComputedStyle(el).backgroundColor,
      classes: getResourceClasses(el),
    }))
  }

  describe.each(['resourceTimeGridDay', 'resourceTimelineDay'])('in %s', (initialView) => {
    it('styles an event by its resourceId', () => {
      expect(getStyling(initialView, { resourceId: 'a' })).toEqual([
        { backgroundColor: RED, classes: ['re1'] },
      ])
    })

    it('styles each copy of an event by the resource it renders in', () => {
      expect(getStyling(initialView, { resourceIds: ['a', 'b'] })).toEqual([
        { backgroundColor: RED, classes: ['re1'] },
        { backgroundColor: GREEN, classes: ['re2', 're3'] },
      ])
    })
  })

  describe('in a view without resources', () => {
    it('styles an event by its resourceId', () => {
      expect(getStyling('timeGridWeek', { resourceId: 'a' })).toEqual([
        { backgroundColor: RED, classes: ['re1'] },
      ])
    })

    it('gives an event of several resources the first one\'s colors and all their classes', () => {
      const calendar = initCalendar({
        ...options,
        initialView: 'timeGridWeek',
        events: [{ id: '1', title: 'event 1', start: '2016-02-14T01:00:00', resourceIds: ['a', 'b'] }],
      })
      const eventEls = getEventEls(calendar.el, '1')
      const titleEl = Array.from(eventEls[0].querySelectorAll<HTMLElement>('*'))
        .find((el) => el.children.length === 0 && el.textContent === 'event 1')!

      expect(eventEls).toHaveLength(1)
      expect(getComputedStyle(eventEls[0]).backgroundColor).toBe(RED)
      expect(getComputedStyle(titleEl).color).toBe(BLUE)
      expect(getResourceClasses(eventEls[0])).toEqual(['re1', 're2', 're3'])
    })
  })
})
