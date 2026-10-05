import { findElements } from '@fullcalendar-tests/standard/lib/dom-misc'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'

// https://github.com/fullcalendar/fullcalendar/issues/4926
describe('resource render props', () => {
  pushOptions({
    now: '2015-11-17',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  })

  function buildResourceClass(prefix: string, resource: { id: string } | undefined) {
    return prefix + '-' + (resource ? resource.id : 'none')
  }

  /*
  Every element tagged by a hook must sit within the column/lane of the resource it was given
  */
  function expectResourceClassesMatchContainers(prefix: string) {
    for (let resourceId of ['a', 'b']) {
      let els = findElements(document.body, `.${prefix}-${resourceId}`)
      expect(els.length).toBeGreaterThan(0)

      for (let el of els) {
        expect(el.closest('[data-resource-id]').getAttribute('data-resource-id')).toBe(resourceId)
      }
    }

    expect(document.querySelectorAll(`.${prefix}-none`).length).toBe(0)
  }

  // classnames from the test themes. excludes hidden more-link probes
  const MORE_LINK_SELECTOR = [
    '.fc-daygrid-more-link',
    '.fc-timegrid-more-link',
    '.fc-timeline-more-link',
  ].map((selector) => selector + ':not([aria-hidden="true"])').join(', ')

  function getMoreLinkEl() {
    return document.querySelector(MORE_LINK_SELECTOR) as HTMLElement
  }

  function getMorePopoverEl() {
    return Array.from(document.querySelectorAll('.fc-more-popover'))
      // must have a day-header, for discerning from license key message
      .filter((el) => Boolean(el.querySelector('.fc-day')))[0] as HTMLElement
  }

  describe('for an event in multiple resources', () => {
    describeOptions({
      'with resourceTimeGrid timed event': {
        initialView: 'resourceTimeGridDay',
        events: [
          { start: '2015-11-17T01:00:00', end: '2015-11-17T05:00:00', resourceIds: ['a', 'b'] },
        ],
      },
      'with resourceTimeGrid all-day event': {
        initialView: 'resourceTimeGridDay',
        events: [
          { start: '2015-11-17', allDay: true, resourceIds: ['a', 'b'] },
        ],
      },
      'with resourceDayGrid': {
        initialView: 'resourceDayGridDay',
        events: [
          { start: '2015-11-17T01:00:00', end: '2015-11-17T05:00:00', resourceIds: ['a', 'b'] },
        ],
      },
      'with resourceDayGrid spanning multiple days': {
        initialView: 'resourceDayGridWeek',
        events: [
          { start: '2015-11-16', end: '2015-11-19', resourceIds: ['a', 'b'] },
        ],
      },
      'with resourceTimeline': {
        initialView: 'resourceTimelineDay',
        events: [
          { start: '2015-11-17T01:00:00', end: '2015-11-17T05:00:00', resourceIds: ['a', 'b'] },
        ],
      },
    }, () => {
      it('gives eventContent the rendered resource', () => {
        let resourceIds: string[] = []
        initCalendar({
          eventContent(info) {
            let resourceId = info.resource ? info.resource.id : 'none'
            if (resourceIds.indexOf(resourceId) === -1) { // hook may fire again on rerender
              resourceIds.push(resourceId)
            }
          },
        })
        expect(resourceIds.sort()).toEqual(['a', 'b'])
      })

      it('gives eventClass the resource of its column/lane', () => {
        initCalendar({
          eventClass: (info) => buildResourceClass('event-res', info.resource),
        })
        expectResourceClassesMatchContainers('event-res')
      })

      it('gives eventDidMount the resource of its column/lane', () => {
        let resourceIdsByEl = new Map<HTMLElement, string>()
        initCalendar({
          eventDidMount(info) {
            resourceIdsByEl.set(info.el, info.resource ? info.resource.id : 'none')
          },
        })
        let foundResourceIds: string[] = []
        resourceIdsByEl.forEach((resourceId, el) => {
          if (el.isConnected) {
            expect(el.closest('[data-resource-id]').getAttribute('data-resource-id')).toBe(resourceId)
            foundResourceIds.push(resourceId)
          }
        })
        expect(foundResourceIds.sort()).toEqual(['a', 'b'])
      })

      it('gives eventTitleClass the resource of its column/lane', () => {
        initCalendar({
          eventTitleClass: (info) => buildResourceClass('title-res', info.resource),
        })
        expectResourceClassesMatchContainers('title-res')
      })
    })
  })

  describe('for a background event in multiple resources', () => {
    const TIMED_BG_EVENTS = [
      { start: '2015-11-17T01:00:00', end: '2015-11-17T05:00:00', resourceIds: ['a', 'b'], display: 'background' },
    ]
    const ALL_DAY_BG_EVENTS = [ // DayGrid only renders all-day background events
      { start: '2015-11-17', allDay: true, resourceIds: ['a', 'b'], display: 'background' },
    ]

    describeOptions({
      'with resourceTimeGrid timed event': {
        initialView: 'resourceTimeGridDay',
        events: TIMED_BG_EVENTS,
      },
      'with resourceTimeGrid all-day event': {
        initialView: 'resourceTimeGridDay',
        events: ALL_DAY_BG_EVENTS,
      },
      'with resourceDayGrid': {
        initialView: 'resourceDayGridDay',
        events: ALL_DAY_BG_EVENTS,
      },
      'with resourceTimeline': {
        initialView: 'resourceTimelineDay',
        events: TIMED_BG_EVENTS,
      },
    }, () => {
      it('gives backgroundEventClass the resource of its column/lane', () => {
        initCalendar({
          backgroundEventClass: (info) => buildResourceClass('bg-res', info.resource),
        })
        expectResourceClassesMatchContainers('bg-res')
      })
    })
  })

  describe('for hidden events behind a more-link', () => {
    const OVERFLOWING_TIMED_EVENTS = [
      { start: '2015-11-17T01:00:00', end: '2015-11-17T02:00:00', resourceIds: ['a', 'b'] },
      { start: '2015-11-17T01:00:00', end: '2015-11-17T02:00:00', resourceIds: ['a', 'b'] },
      { start: '2015-11-17T01:00:00', end: '2015-11-17T02:00:00', resourceIds: ['a', 'b'] },
    ]

    describeOptions({
      'with resourceTimeGrid timed events': {
        initialView: 'resourceTimeGridDay',
        eventMaxStack: 1,
        events: OVERFLOWING_TIMED_EVENTS,
      },
      'with resourceTimeGrid all-day events': {
        initialView: 'resourceTimeGridDay',
        dayMaxEvents: 1,
        events: [
          { start: '2015-11-17', allDay: true, resourceIds: ['a', 'b'] },
          { start: '2015-11-17', allDay: true, resourceIds: ['a', 'b'] },
          { start: '2015-11-17', allDay: true, resourceIds: ['a', 'b'] },
        ],
      },
      'with resourceDayGrid': {
        initialView: 'resourceDayGridDay',
        dayMaxEvents: 1,
        events: OVERFLOWING_TIMED_EVENTS,
      },
      'with resourceTimeline': {
        initialView: 'resourceTimelineDay',
        eventMaxStack: 1,
        events: OVERFLOWING_TIMED_EVENTS,
      },
    }, () => {
      it('gives moreLinkClass the resource of its column/lane', async () => {
        initCalendar({
          moreLinkClass: (info) => buildResourceClass('more-res', info.resource),
        })
        await waitTimeout()
        // the hidden more-link probe has no resource. ignore it
        for (let el of findElements(document.body, '.more-res-none')) {
          expect(el.getAttribute('aria-hidden')).toBe('true')
        }
        for (let resourceId of ['a', 'b']) {
          let els = findElements(document.body, `.more-res-${resourceId}`)
          expect(els.length).toBeGreaterThan(0)

          for (let el of els) {
            expect(el.closest('[data-resource-id]').getAttribute('data-resource-id')).toBe(resourceId)
          }
        }
      })

      it('gives moreLinkContent the resource', async () => {
        let resourceIds: string[] = []
        initCalendar({
          moreLinkContent(info) {
            if (info.resource && resourceIds.indexOf(info.resource.id) === -1) {
              resourceIds.push(info.resource.id)
            }
            return info.text
          },
        })
        await waitTimeout()
        expect(resourceIds.sort()).toEqual(['a', 'b'])
      })

      it('gives the popover\'s event, day-header, and day-cell hooks the resource', async () => {
        initCalendar({
          eventClass: (info) => buildResourceClass('event-res', info.resource),
          dayHeaderClass: (info) => (info.inPopover ? buildResourceClass('header-res', info.resource) : ''),
          dayCellClass: (info) => (info.inPopover ? buildResourceClass('cell-res', info.resource) : ''),
        })
        await waitTimeout()
        let moreLinkEl = getMoreLinkEl()
        let resourceId = moreLinkEl.closest('[data-resource-id]').getAttribute('data-resource-id')

        $(moreLinkEl).simulate('click')
        await waitTimeout()
        let popoverEl = getMorePopoverEl()
        let popoverEventEls = findElements(popoverEl, '.fc-event')
        expect(popoverEventEls.length).toBeGreaterThan(0)

        for (let el of popoverEventEls) {
          expect(el).toHaveClass(`event-res-${resourceId}`)
        }
        expect(popoverEl.querySelectorAll(`.header-res-${resourceId}`).length).toBe(1)
        expect(popoverEl.querySelectorAll(`.cell-res-${resourceId}`).length).toBe(1)
      })
    })
  })

  describe('in non-resource views', () => {
    describeOptions('initialView', {
      'with timeGrid': 'timeGridDay',
      'with dayGrid': 'dayGridDay',
      'with timeline': 'timelineDay',
      'with list': 'listDay',
    }, () => {
      it('leaves the resource undefined', () => {
        let callCnt = 0
        let sawResource = false
        initCalendar({
          events: [
            { start: '2015-11-17T01:00:00', end: '2015-11-17T05:00:00', resourceIds: ['a', 'b'] },
          ],
          eventContent(info) {
            callCnt += 1
            if (info.resource !== undefined) {
              sawResource = true
            }
          },
        })
        expect(callCnt).toBeGreaterThan(0)
        expect(sawResource).toBe(false)
      })
    })
  })
})
