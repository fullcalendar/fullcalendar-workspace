import { Calendar } from 'fullcalendar'
import { Draggable } from 'fullcalendar/interaction'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { findElements } from '@fullcalendar-tests/standard/lib/dom-misc'
import { CalendarWrapper } from '@fullcalendar-tests/standard/lib/wrappers/CalendarWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

/*
Behavior locks for the day-table pipeline (planning/phase-7b-day-table-plan.md §1.3, §4.2): how the
resource day views split events, business hours, selections and interactions by resource, and join
them back into columns. Written against the split/slice/join pipeline before its replacement, so
every expectation is today's behavior, quirks included (commented as such).
*/

const DAY_1 = '2016-12-04' // Sunday
const DAY_2 = '2016-12-05' // Monday
const DAY_3 = '2016-12-06' // Tuesday
const DAY_4 = '2016-12-07' // Wednesday

describe('vresource slicing rules', () => {
  pushOptions({
    initialDate: DAY_1,
    now: DAY_1,
    scrollTime: '00:00',
    dragRevertDuration: 0,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    views: {
      resourceTimeGridThreeDay: {
        type: 'resourceTimeGrid',
        duration: { days: 3 },
      },
      resourceDayGridThreeDay: {
        type: 'resourceDayGrid',
        duration: { days: 3 },
      },
    },
  })

  describeOptions({
    'with resources above dates': { datesAboveResources: false },
    'with dates above resources': { datesAboveResources: true },
  }, () => {
    describeValues({
      'in resource timeGrid': 'timeGrid',
      'in resource dayGrid': 'dayGrid',
    }, (family: 'timeGrid' | 'dayGrid') => {
      const isTimeGrid = family === 'timeGrid'

      pushOptions({
        initialView: isTimeGrid ? 'resourceTimeGridThreeDay' : 'resourceDayGridThreeDay',
      })

      // 1. foreground events with no resource
      // -------------------------------------------------------------------------------------------

      it('renders a foreground event with no resource nowhere', () => {
        let calendar = initCalendar({
          events: [
            buildEvent({ className: 'with-resource', date: DAY_1, resourceId: 'a' }),
            buildEvent({ className: 'no-resource', date: DAY_2 }),
          ],
        })

        expect(getFgEventEls(calendar.el).length).toBe(1)
        expect(calendar.el.querySelectorAll('.with-resource').length).toBe(1)
        expect(calendar.el.querySelectorAll('.no-resource').length).toBe(0)
      })

      // QUIRK: with no resources at all, the view's columns are inert placeholders and even
      // resourceless foreground events render nowhere, while background events still do
      // (VResourceJoiner skips the all-resource set for foreground segs)
      it('renders no foreground event at all in a resourceless view', () => {
        let calendar = initCalendar({
          resources: [],
          events: [
            buildEvent({ className: 'no-resource', date: DAY_2 }),
            buildEvent({ className: 'bg', date: DAY_2, display: 'background', allDay: true }),
          ],
        })
        expect(getHeaderResourceIds(calendar, family)).toEqual([])
        expect(getFgEventEls(calendar.el).length).toBe(0)
        expect(calendar.el.querySelectorAll('.fc-bg-event').length).toBe(isTimeGrid ? 2 : 1) // all-day cell and lane
        expect(calendar.el.querySelectorAll('[role=cell][aria-disabled]').length).toBeGreaterThan(0)
      })

      // 2. background events with no resource
      // -------------------------------------------------------------------------------------------

      it('renders a background event with no resource once in every resource column', () => {
        let calendar = initCalendar({
          events: [
            buildEvent({ date: DAY_1, display: 'background', allDay: true }),
          ],
        })

        expect(countBgEventsInColumn(calendar, family, 'a', DAY_1)).toBe(1)
        expect(countBgEventsInColumn(calendar, family, 'b', DAY_1)).toBe(1)
        expect(countBgEventsInColumn(calendar, family, 'a', DAY_2)).toBe(0)
        expect(countBgEventsInColumn(calendar, family, 'b', DAY_2)).toBe(0)
      })

      it('renders a resource\'s background event only in its own columns', () => {
        let calendar = initCalendar({
          events: [
            buildEvent({ date: DAY_1, display: 'background', resourceId: 'b', allDay: true }),
          ],
        })

        expect(countBgEventsInColumn(calendar, family, 'a', DAY_1)).toBe(0)
        expect(countBgEventsInColumn(calendar, family, 'b', DAY_1)).toBe(1)
      })

      // 3. business hours
      // -------------------------------------------------------------------------------------------

      it('gives a resource its own business hours and the others the calendar\'s', () => {
        let calendar = initCalendar({
          businessHours: true, // Mon-Fri 9-5
          resources: [
            { id: 'a', title: 'Resource A' },
            { id: 'b', title: 'Resource B', businessHours: { daysOfWeek: [0], startTime: '00:00', endTime: '24:00' } },
          ],
        })

        // a: the calendar's. Sunday is non-business, weekdays partly (timeGrid) or not at all (dayGrid)
        expect(countNonBusinessInColumn(calendar, family, 'a', DAY_1)).toBe(1)
        expect(countNonBusinessInColumn(calendar, family, 'a', DAY_2)).toBe(isTimeGrid ? 2 : 0)
        // b: its own. Sunday is business, weekdays aren't. In dayGrid with resources above dates
        // the Mon-Tue fill is one span, attached to Monday's cell
        expect(countNonBusinessInColumn(calendar, family, 'b', DAY_1)).toBe(0)
        expect(countNonBusinessInColumn(calendar, family, 'b', DAY_2)).toBe(1)
        expect(countNonBusinessInColumn(calendar, family, 'b', DAY_3)).toBe(
          (isTimeGrid || calendar.getOption('datesAboveResources')) ? 1 : 0,
        )
      })

      it('renders a resource\'s business hours even when the calendar has none', () => {
        let calendar = initCalendar({
          businessHours: false,
          resources: [
            { id: 'a', title: 'Resource A' },
            { id: 'b', title: 'Resource B', businessHours: { daysOfWeek: [0], startTime: '00:00', endTime: '24:00' } },
          ],
        })

        expect(countNonBusinessInColumn(calendar, family, 'a', DAY_1)).toBe(0)
        expect(countNonBusinessInColumn(calendar, family, 'a', DAY_2)).toBe(0)
        expect(countNonBusinessInColumn(calendar, family, 'b', DAY_1)).toBe(0)
        expect(countNonBusinessInColumn(calendar, family, 'b', DAY_2)).toBe(1)
      })

      if (isTimeGrid) {
        it('renders business hours in both the all-day row and the columns', () => {
          let calendar = initCalendar({
            businessHours: true, // Mon-Fri 9-5
          })

          // Sunday is non-business in the all-day cell and as a whole-day lane fill
          expect(getNonBusinessEls(getAllDayCellEl(calendar, 'a', DAY_1)).length).toBe(1)
          expect(getNonBusinessEls(getLaneEl(calendar, 'a', DAY_1)).length).toBe(1)
          // Monday is business all-day, and partly in the lane
          expect(getNonBusinessEls(getAllDayCellEl(calendar, 'a', DAY_2)).length).toBe(0)
          expect(getNonBusinessEls(getLaneEl(calendar, 'a', DAY_2)).length).toBe(2)
        })
      }

      // 4. date selection
      // -------------------------------------------------------------------------------------------

      it('highlights every resource column for a selection with no resource', () => {
        let calendar = initCalendar({
          selectable: true,
        })

        calendar.select(buildSelection(isTimeGrid, DAY_1, DAY_2))

        expect(countHighlightsInColumn(calendar, family, 'a', DAY_1)).toBe(1)
        expect(countHighlightsInColumn(calendar, family, 'b', DAY_1)).toBe(1)
        expect(countHighlightsInColumn(calendar, family, 'a', DAY_2)).toBe(0)
        expect(countHighlightsInColumn(calendar, family, 'b', DAY_2)).toBe(0)
      })

      it('highlights only the resource\'s columns for a selection with a resource', () => {
        let calendar = initCalendar({
          selectable: true,
        })

        calendar.select({ ...buildSelection(isTimeGrid, DAY_1, DAY_2), resourceId: 'b' } as any)

        expect(countHighlightsInColumn(calendar, family, 'a', DAY_1)).toBe(0)
        expect(countHighlightsInColumn(calendar, family, 'b', DAY_1)).toBe(1)
      })

      // 7. a multi-resource, multi-day event, per ordering
      // -------------------------------------------------------------------------------------------

      if (!isTimeGrid) {
        it('spans a multi-resource event per resource, broken per date only with dates above resources', () => {
          let calendar = initCalendar({
            initialView: 'resourceDayGridWeek',
            events: [
              { title: 'multi', start: DAY_2, end: '2016-12-08', resourceIds: ['a', 'b'] }, // Mon-Wed
            ],
          })
          let eventEls = getFgEventEls(calendar.el)
          let datesAboveResources = calendar.getOption('datesAboveResources')

          if (datesAboveResources) {
            // one seg per (date, resource)
            expect(eventEls.length).toBe(6)
            expectSegFlags(getFgEventElsInCell(calendar, 'a', DAY_2)[0], true, false)
            expectSegFlags(getFgEventElsInCell(calendar, 'a', DAY_3)[0], false, false)
            expectSegFlags(getFgEventElsInCell(calendar, 'a', DAY_4)[0], false, true)
            expectSegFlags(getFgEventElsInCell(calendar, 'b', DAY_2)[0], true, false)
          } else {
            // one continuous span per resource
            expect(eventEls.length).toBe(2)
            for (let resourceId of ['a', 'b']) {
              let eventEl = getFgEventElsInCell(calendar, resourceId, DAY_2)[0]

              expectSegFlags(eventEl, true, true)
              expectElSpansCells(eventEl, getDayCellEl(calendar, resourceId, DAY_2), getDayCellEl(calendar, resourceId, DAY_4))
            }
          }
        })

        it('clamps a multi-resource event around an interior hidden day', () => {
          let calendar = initCalendar({
            initialView: 'resourceDayGridWeek',
            hiddenDays: [2], // Tuesday, inside the event
            events: [
              { title: 'multi', start: DAY_2, end: '2016-12-08', resourceIds: ['a', 'b'] }, // Mon-Wed
            ],
          })
          let eventEls = getFgEventEls(calendar.el)
          let datesAboveResources = calendar.getOption('datesAboveResources')

          expect(getDayCellEl(calendar, 'a', DAY_3)).toBe(null)

          if (datesAboveResources) {
            expect(eventEls.length).toBe(4) // Mon and Wed, per resource
            expectSegFlags(getFgEventElsInCell(calendar, 'a', DAY_2)[0], true, false)
            expectSegFlags(getFgEventElsInCell(calendar, 'a', DAY_4)[0], false, true)
          } else {
            expect(eventEls.length).toBe(2) // Mon-Wed, now adjacent, per resource
            for (let resourceId of ['a', 'b']) {
              let eventEl = getFgEventElsInCell(calendar, resourceId, DAY_2)[0]

              expectSegFlags(eventEl, true, true)
              expectElSpansCells(eventEl, getDayCellEl(calendar, resourceId, DAY_2), getDayCellEl(calendar, resourceId, DAY_4))
            }
          }
        })

        // 8. a column missing in the middle of a span (per-date filtering)
        it('breaks a resource\'s selection at a date it has no column for', () => {
          let calendar = initCalendar({
            filterResourcesWithEvents: true,
            selectable: true,
            events: [
              { title: 'a1', start: DAY_1, resourceId: 'a' },
              { title: 'b2', start: DAY_2, resourceId: 'b' }, // day 2 exists, but not for a
              { title: 'a3', start: DAY_3, resourceId: 'a' },
            ],
          })

          expect(getDayCellEl(calendar, 'a', DAY_2)).toBe(null)

          calendar.select({ start: DAY_1, end: DAY_4, allDay: true, resourceId: 'a' } as any)

          let highlightEls = findElements(calendar.el, '.fc-highlight')

          expect(highlightEls.length).toBe(2) // two pieces, not one span
          expect(countHighlightsInColumn(calendar, family, 'a', DAY_1)).toBe(1)
          expect(countHighlightsInColumn(calendar, family, 'a', DAY_3)).toBe(1)
          expect(countHighlightsInColumn(calendar, family, 'b', DAY_2)).toBe(0)
          for (let highlightEl of highlightEls) {
            expectElWithinEl(highlightEl, highlightEl.closest('[role=cell]') as HTMLElement)
          }
        })

        // 9. multi-row
        it('renders an event across a week boundary in both rows, under its resource', () => {
          let calendar = initCalendar({
            initialView: 'resourceDayGridMonth',
            events: [
              { title: 'crossing', start: '2016-12-09', end: '2016-12-13', resourceId: 'a' }, // Fri-Mon
            ],
          })
          let eventEls = getFgEventEls(calendar.el)
          // one seg per row, or per (row, date) with dates above resources (each date is a group)
          let expectedCnt = calendar.getOption('datesAboveResources') ? 4 : 2

          expect(eventEls.length).toBe(expectedCnt)
          for (let eventEl of eventEls) {
            expect(eventEl.closest('[data-resource-id]').getAttribute('data-resource-id')).toBe('a')
          }
          expectSegFlags(eventEls[0], true, false)
          expectSegFlags(eventEls[expectedCnt - 1], false, true)
          for (let eventEl of eventEls.slice(1, -1)) {
            expectSegFlags(eventEl, false, false)
          }
          expect(getFgEventElsInCell(calendar, 'a', '2016-12-09').length).toBe(1)
          expect(getFgEventElsInCell(calendar, 'a', '2016-12-11').length).toBe(1)
        })
      }

      // 11. participation vs columns
      // -------------------------------------------------------------------------------------------

      describe('with per-date filtering', () => {
        pushOptions({
          filterResourcesWithEvents: true,
          initialView: isTimeGrid ? 'resourceTimeGridWeek' : 'resourceDayGridWeek',
        })

        // (a) b survives view-wide filtering (its event is inside the active range) but earns no
        // column (its only event is on a hidden day), so it owns nothing in the header or the body
        it('gives a resource with events only on a hidden day no column, nothing to select, no business hours', () => {
          let calendar = initCalendar({
            selectable: true,
            hiddenDays: [1], // Monday
            businessHours: false,
            resources: [
              { id: 'a', title: 'Resource A' },
              { id: 'b', title: 'Resource B', businessHours: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '02:00', endTime: '22:00' } },
            ],
            events: [
              buildEvent({ date: DAY_1, resourceId: 'a' }),
              buildEvent({ date: DAY_2, resourceId: 'b' }), // hidden
              buildEvent({ date: DAY_2, resourceId: 'b', display: 'background', allDay: true }), // hidden too
            ],
          })

          expectSurvivesViewWideFiltering(calendar, ['a', 'b'])
          expect(getHeaderResourceIds(calendar, family)).toEqual(['a'])
          expect(calendar.el.querySelectorAll('[data-resource-id="b"]').length).toBe(0)
          expect(calendar.el.querySelectorAll('.fc-non-business').length).toBe(0)
          expect(calendar.el.querySelectorAll('.fc-bg-event').length).toBe(0)

          calendar.select({ ...buildSelection(isTimeGrid, DAY_1, DAY_2), resourceId: 'b' } as any)

          expect(calendar.el.querySelectorAll('.fc-highlight').length).toBe(0)
        })

        // (b) every resource survives view-wide filtering, none earns a column: the model falls
        // back to plain day columns and nothing participates anymore (not even for a selection
        // or a resource's business hours). This is the all-columns-filtered fallback, not the
        // no-resources branch: the hidden day is interior, so the events stay inside the active
        // range (hidden weekends would be trimmed off the range and fail view-wide filtering)
        it('falls back to plain columns, with no resource participating, when every column would be a placeholder', () => {
          let calendar = initCalendar({
            selectable: true,
            hiddenDays: [3], // Wednesday
            businessHours: false,
            resources: [
              { id: 'a', title: 'Resource A', businessHours: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '02:00', endTime: '22:00' } },
              { id: 'b', title: 'Resource B', businessHours: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '02:00', endTime: '22:00' } },
            ],
            events: [
              buildEvent({ date: DAY_4, resourceId: 'a' }), // hidden
              buildEvent({ date: DAY_4, resourceId: 'b' }), // hidden
            ],
          })
          let header = getHeader(calendar, family)

          expectSurvivesViewWideFiltering(calendar, ['a', 'b'])
          expect(getHeaderResourceIds(calendar, family)).toEqual([])
          expect(header.getCellInfoByRow().length).toBe(1) // the plain date row
          expect(calendar.el.querySelectorAll('[data-resource-id]').length).toBe(0)
          expect(calendar.el.querySelectorAll('[role=cell][aria-disabled]').length).toBeGreaterThan(0)
          expect(calendar.el.querySelectorAll('.fc-non-business').length).toBe(0) // no resource business hours

          calendar.select({ ...buildSelection(isTimeGrid, DAY_1, DAY_2), resourceId: 'b' } as any)

          expect(calendar.el.querySelectorAll('.fc-highlight').length).toBe(0)
        })

        it('keeps the calendar\'s business hours in the fallback', () => {
          let calendar = initCalendar({
            hiddenDays: [3], // Wednesday
            businessHours: true,
            events: [
              buildEvent({ date: DAY_4, resourceId: 'a' }), // hidden
              buildEvent({ date: DAY_4, resourceId: 'b' }), // hidden
            ],
          })

          expect(getHeaderResourceIds(calendar, family)).toEqual([])
          expect(calendar.el.querySelectorAll('.fc-non-business').length).toBeGreaterThan(0)
        })
      })
    })
  })

  // 4. one-day cross-resource selection
  // -----------------------------------------------------------------------------------------------

  // QUIRK: a one-day view allows a selection across resource columns, and reports the resource of
  // the hit where the drag started (isHitComboAllowed's allowAcrossResources is "one date column")
  describe('in a one-day resource timeGrid', () => {
    pushOptions({
      initialView: 'resourceTimeGridDay',
      selectable: true,
    })

    it('allows a timed selection across resources, reporting the first resource', async () => {
      let selectSpy = jasmine.createSpy('select')
      let calendar = initCalendar({ select: selectSpy })
      let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await waitTimeout()
      await simulatePointerDrag(timeGrid.getPoint('a', DAY_1 + 'T02:00:00'), timeGrid.getPoint('b', DAY_1 + 'T04:00:00'))

      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(selectSpy.calls.argsFor(0)[0].resource.id).toBe('a')
      expect(selectSpy.calls.argsFor(0)[0].start).toEqualDate(DAY_1 + 'T02:00:00Z')
      expect(selectSpy.calls.argsFor(0)[0].end).toEqualDate(DAY_1 + 'T04:30:00Z')

      // reverse: the drag starts in b
      await simulatePointerDrag(timeGrid.getPoint('b', DAY_1 + 'T04:00:00'), timeGrid.getPoint('a', DAY_1 + 'T02:00:00'))

      expect(selectSpy).toHaveBeenCalledTimes(2)
      expect(selectSpy.calls.argsFor(1)[0].resource.id).toBe('b')
    })

    it('allows an all-day selection across resources, reporting the first resource', async () => {
      let selectSpy = jasmine.createSpy('select')
      let calendar = initCalendar({ select: selectSpy })

      await waitTimeout()
      await simulatePointerDrag(getElCenter(getAllDayCellEl(calendar, 'a', DAY_1)), getElCenter(getAllDayCellEl(calendar, 'b', DAY_1)))

      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(selectSpy.calls.argsFor(0)[0].allDay).toBe(true)
      expect(selectSpy.calls.argsFor(0)[0].resource.id).toBe('a')
    })

    it('disallows a selection across resources in a multi-day view', async () => {
      let selectSpy = jasmine.createSpy('select')
      let calendar = initCalendar({ initialView: 'resourceTimeGridThreeDay', select: selectSpy })
      let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await waitTimeout()
      await simulatePointerDrag(timeGrid.getPoint('a', DAY_1 + 'T02:00:00'), timeGrid.getPoint('b', DAY_1 + 'T04:00:00'))

      expect(selectSpy).not.toHaveBeenCalled()
    })
  })

  // 5. drag mirrors
  // -----------------------------------------------------------------------------------------------

  describe('mirrors mid-drag', () => {
    pushOptions({
      editable: true,
      initialView: 'resourceTimeGridThreeDay',
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
        { id: 'c', title: 'Resource C' },
      ],
    })

    describeOptions({
      'with resources above dates': { datesAboveResources: false },
      'with dates above resources': { datesAboveResources: true },
    }, () => {
      describeOptions('direction', {
        'when LTR': 'ltr',
        'when RTL': 'rtl',
      }, () => {
        it('shows a single-resource event\'s mirror in the target column only', async () => {
          let calendar = initCalendar({
            events: [
              buildEvent({ className: 'single', date: DAY_1, resourceId: 'a' }),
            ],
          })
          let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

          await waitTimeout()
          await simulateElDrag(
            calendar.el.querySelector('.single') as HTMLElement,
            timeGrid.getPoint('b', DAY_1 + 'T04:00:00'),
            () => {
              expect(getMirrorEls(calendar.el).length).toBe(1)
              expect(getMirrorEls(getLaneEl(calendar, 'b', DAY_1)).length).toBe(1)
              expect(getMirrorEls(getLaneEl(calendar, 'a', DAY_1)).length).toBe(0)
            },
          )
        })
      })

      it('moves only the dragged copy of a multi-resource event, keeping its other copies\' mirrors', async () => {
        let calendar = initCalendar({
          events: [
            buildEvent({ className: 'multi', date: DAY_1, resourceIds: ['a', 'c'] }),
          ],
        })
        let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

        await waitTimeout()
        await simulateElDrag(
          getLaneEl(calendar, 'a', DAY_1).querySelector('.multi') as HTMLElement,
          timeGrid.getPoint('b', DAY_1 + 'T04:00:00'),
          () => {
            // [a, c] becomes [c, b] during the drag: mirrors in c (shifted) and b, none in a
            expect(getMirrorEls(calendar.el).length).toBe(2)
            expect(getMirrorEls(getLaneEl(calendar, 'b', DAY_1)).length).toBe(1)
            expect(getMirrorEls(getLaneEl(calendar, 'c', DAY_1)).length).toBe(1)
            expect(getMirrorEls(getLaneEl(calendar, 'a', DAY_1)).length).toBe(0)
          },
        )
      })

      it('shows an external element\'s mirror in the target column only', async () => {
        let dragEl = $(
          `<a class="external-event ${CalendarWrapper.EVENT_CLASSNAME}" style="width:100px">external</a>`,
        ).appendTo('body')

        new Draggable(dragEl[0], { // eslint-disable-line no-new
          eventData: { title: 'external' },
        })

        let calendar = initCalendar({ droppable: true })
        let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

        await waitTimeout()
        await simulateElDrag(
          dragEl[0],
          timeGrid.getPoint('b', DAY_1 + 'T04:00:00'),
          () => {
            expect(getMirrorEls(calendar.el).length).toBe(1)
            expect(getMirrorEls(getLaneEl(calendar, 'b', DAY_1)).length).toBe(1)
          },
        )
        dragEl.remove()
      })

      // dayGrid shows a dragged event as a cell highlight, not a mirror (a mirror only for resizes)
      it('highlights the target dayGrid cell only', async () => {
        let calendar = initCalendar({
          initialView: 'resourceDayGridThreeDay',
          events: [
            { title: 'single', className: 'single', start: DAY_1, resourceId: 'a' },
          ],
        })

        await waitTimeout()
        await simulateElDrag(
          calendar.el.querySelector('.single') as HTMLElement,
          getElCenter(getDayCellEl(calendar, 'b', DAY_2)),
          () => {
            expect(getMirrorEls(calendar.el).length).toBe(0)
            expect(findElements(calendar.el, '.fc-highlight').length).toBe(1)
            expect(findElements(getDayCellEl(calendar, 'b', DAY_2), '.fc-highlight').length).toBe(1)
          },
        )
      })
    })

    // 12. a grouped drag mixing a resource event and a resourceless one
    // ---------------------------------------------------------------------------------------------

    // The resourceless partner's mirror expands into every resource column (never a placeholder)
    // while its original copies render nowhere (rule 1). Its exclusion from the joined
    // affectedInstances is state-only and can't be observed here (see the plan's state-level lock)
    describe('of a grouped pair', () => {
      pushOptions({
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        events: [
          { title: 'A', className: 'event-a', start: DAY_1 + 'T02:00:00', end: DAY_1 + 'T03:00:00', resourceId: 'a', groupId: 'g' },
          { title: 'B', className: 'event-b', start: DAY_1 + 'T05:00:00', end: DAY_1 + 'T06:00:00', groupId: 'g' },
        ],
      })

      it('mirrors the resourceless partner in every resource column when dragging', async () => {
        let calendar = initCalendar()
        let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

        await waitTimeout()
        expect(calendar.el.querySelectorAll('.event-b').length).toBe(0) // rule 1

        await simulateElDrag(
          calendar.el.querySelector('.event-a') as HTMLElement,
          timeGrid.getPoint('b', DAY_1 + 'T04:00:00'),
          () => {
            expect(getMirrorEls(calendar.el, '.event-a').length).toBe(1)
            expect(getMirrorEls(getLaneEl(calendar, 'b', DAY_1), '.event-a').length).toBe(1)
            expect(getMirrorEls(calendar.el, '.event-b').length).toBe(2)
            expect(getMirrorEls(getLaneEl(calendar, 'a', DAY_1), '.event-b').length).toBe(1)
            expect(getMirrorEls(getLaneEl(calendar, 'b', DAY_1), '.event-b').length).toBe(1)
          },
        )
      })

      it('mirrors the resourceless partner in every resource column when resizing', async () => {
        let calendar = initCalendar()
        let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

        await waitTimeout()
        let eventEl = calendar.el.querySelector('.event-a') as HTMLElement
        let resizerEl = $(eventEl).find('.' + CalendarWrapper.EVENT_RESIZER_CLASSNAME).css('display', 'block')[0]
        let resizerPoint = getElCenter(resizerEl)
        let destPoint = timeGrid.getPoint('a', DAY_1 + 'T04:00:00')

        await simulateElDrag(
          resizerEl,
          { left: resizerPoint.left, top: destPoint.top },
          () => {
            expect(getMirrorEls(calendar.el, '.event-a').length).toBe(1)
            expect(getMirrorEls(getLaneEl(calendar, 'a', DAY_1), '.event-a').length).toBe(1)
            expect(getMirrorEls(calendar.el, '.event-b').length).toBe(2)
            expect(getMirrorEls(getLaneEl(calendar, 'a', DAY_1), '.event-b').length).toBe(1)
            expect(getMirrorEls(getLaneEl(calendar, 'b', DAY_1), '.event-b').length).toBe(1)
          },
        )
      })
    })
  })

  // 6. event selection is instance-wide
  // -----------------------------------------------------------------------------------------------

  describe('event selection', () => {
    pushOptions({
      initialView: 'resourceTimeGridDay',
      editable: true,
      longPressDelay: 100,
      events: [
        buildEvent({ className: 'multi', date: DAY_1, resourceIds: ['a', 'b'] }),
      ],
    })

    it('marks every copy of a multi-resource event selected, and keeps them across a re-render', async () => {
      let calendar = initCalendar({
        eventClass: (info) => (info.isSelected ? 'is-selected' : ''),
      })

      await waitTimeout()
      expect(calendar.el.querySelectorAll('.multi').length).toBe(2)
      expect(calendar.el.querySelectorAll('.is-selected').length).toBe(0)

      // a touch press selects an event
      await simulateTouchPress(getLaneEl(calendar, 'a', DAY_1).querySelector('.multi') as HTMLElement)
      await waitTimeout()

      expect(calendar.el.querySelectorAll('.multi.is-selected').length).toBe(2)

      calendar.render()
      await waitTimeout()

      expect(calendar.el.querySelectorAll('.multi.is-selected').length).toBe(2)
    })
  })

  // 10. sort ties follow instance order
  // -----------------------------------------------------------------------------------------------

  describe('sort ties', () => {
    // same start, duration, allDay and title: eventOrder can't decide, so the store's instance order
    // does. A single event's instance exists from parsing, a recurring def's instances are appended
    // by expansion, so the single event comes first even when its def is listed second
    it('render a single event before a recurring one in resource timeGrid', async () => {
      let calendar = initCalendar({
        initialView: 'resourceTimeGridDay',
        events: [
          { title: 'X', className: 'recurring', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '02:00', endTime: '03:00', resourceId: 'a' },
          { title: 'X', className: 'single', start: DAY_1 + 'T02:00:00', end: DAY_1 + 'T03:00:00', resourceId: 'a' },
        ],
      })

      await waitTimeout()
      expect(getFgEventEls(getLaneEl(calendar, 'a', DAY_1)).map(getEventKind)).toEqual(['single', 'recurring'])
    })

    it('render a single event before a recurring one in resource dayGrid', async () => {
      let calendar = initCalendar({
        initialView: 'resourceDayGridDay',
        events: [
          { title: 'X', className: 'recurring', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], resourceId: 'a' },
          { title: 'X', className: 'single', start: DAY_1, resourceId: 'a' },
        ],
      })

      await waitTimeout()
      expect(getFgEventEls(getDayCellEl(calendar, 'a', DAY_1)).map(getEventKind)).toEqual(['single', 'recurring'])
    })
  })

  // 13. source styles during cross-resource and cross-lane drags
  // -----------------------------------------------------------------------------------------------

  // A key's event UI bases include an event's source base only for the keys the event belongs to
  // in the current (unmutated) store. A mirror in another resource, in the other lane, or in
  // another calendar is compiled without it, so it loses the source's color
  describe('source styles', () => {
    pushOptions({
      initialView: 'resourceTimeGridDay',
      editable: true,
      eventSources: [{
        color: 'red',
        events: [
          buildEvent({ className: 'sourced', date: DAY_1, resourceId: 'a' }),
        ],
      }],
    })

    it('are lost by a mirror in another resource', async () => {
      let lastMirrorColor: string | null = null
      let calendar = initCalendar({
        eventClass(info) {
          if (info.isMirror) {
            lastMirrorColor = info.color // the mirror passes through a's column first, where it is red
          }
          return ''
        },
      })
      let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await waitTimeout()
      let eventEl = calendar.el.querySelector('.sourced') as HTMLElement

      expect(getEventColor(eventEl)).toBe('red')

      await simulateElDrag(
        eventEl,
        timeGrid.getPoint('b', DAY_1 + 'T04:00:00'),
        () => {
          let mirrorEl = getMirrorEls(getLaneEl(calendar, 'b', DAY_1))[0]

          expect(mirrorEl).toBeTruthy()
          expect(getEventColor(mirrorEl)).not.toBe('red')
        },
      )

      expect(lastMirrorColor).not.toBe(null)
      expect(lastMirrorColor).not.toBe('red')
    })

    // (no all-day-row case: the all-day row shows a dragged event as a highlight, not a mirror, so
    // a cross-lane mirror's styles can't be observed)

    it('are lost by a mirror in another calendar', async () => {
      let sourceCalendar = initCalendar()
      let targetEl = document.createElement('div')

      document.body.appendChild(targetEl)
      let targetCalendar = initCalendar({ eventSources: [], droppable: true }, targetEl)
      let targetTimeGrid = new ResourceTimeGridViewWrapper(targetCalendar).timeGrid

      await waitTimeout()
      let eventEl = sourceCalendar.el.querySelector('.sourced') as HTMLElement

      await simulateElDrag(
        eventEl,
        targetTimeGrid.getPoint('b', DAY_1 + 'T04:00:00'),
        () => {
          let mirrorEl = getMirrorEls(getLaneEl(targetCalendar, 'b', DAY_1))[0]

          expect(mirrorEl).toBeTruthy()
          expect(getEventColor(mirrorEl)).not.toBe('red')
        },
      )
      targetEl.remove()
    })
  })

  // 14. all-day classification is def-level
  // -----------------------------------------------------------------------------------------------

  describe('all-day and timed lanes', () => {
    pushOptions({
      initialView: 'resourceTimeGridDay',
    })

    it('render an all-day background event with def-level display in both the all-day row and the columns', () => {
      let calendar = initCalendar({
        events: [
          { start: DAY_1, allDay: true, display: 'background', resourceId: 'a' },
        ],
      })

      expect(getBgEventEls(getAllDayCellEl(calendar, 'a', DAY_1)).length).toBe(1)
      expect(getBgEventEls(getLaneEl(calendar, 'a', DAY_1)).length).toBe(1)
    })

    // QUIRK: the lane split reads the def's own display, not the compiled one, so a source-level
    // (or calendar-level) background display keeps an all-day event in the all-day row only
    it('render an all-day background event with source-level display in the all-day row only', () => {
      let calendar = initCalendar({
        eventSources: [{
          display: 'background',
          events: [
            { start: DAY_1, allDay: true, resourceId: 'a' },
          ],
        }],
      })

      expect(getBgEventEls(getAllDayCellEl(calendar, 'a', DAY_1)).length).toBe(1)
      expect(getBgEventEls(getLaneEl(calendar, 'a', DAY_1)).length).toBe(0)
    })

    it('render a timed background event in the columns only', () => {
      let calendar = initCalendar({
        events: [
          buildEvent({ date: DAY_1, display: 'background', resourceId: 'a' }),
        ],
      })

      expect(getBgEventEls(getAllDayCellEl(calendar, 'a', DAY_1)).length).toBe(0)
      expect(getBgEventEls(getLaneEl(calendar, 'a', DAY_1)).length).toBe(1)
    })
  })

  // 15. inverse-background groups shared across resources
  // -----------------------------------------------------------------------------------------------

  describe('inverse-background events', () => {
    pushOptions({
      initialView: 'resourceTimeGridDay',
    })

    it('invert per resource, per group, with defs lacking instances and complements after other fills', () => {
      let calendar = initCalendar({
        events: [
          // group g: a is busy 2-4 and 6-8, b only 6-8
          { groupId: 'g', display: 'inverse-background', start: DAY_1 + 'T02:00:00', end: DAY_1 + 'T04:00:00', resourceId: 'a' },
          { groupId: 'g', display: 'inverse-background', start: DAY_1 + 'T06:00:00', end: DAY_1 + 'T08:00:00', resourceIds: ['a', 'b'] },
          // group g2 for b has no instance in range: its complement is the whole day
          { groupId: 'g2', display: 'inverse-background', start: '2020-01-01T02:00:00', end: '2020-01-01T04:00:00', resourceId: 'b' },
          // a plain background event for b, emitted before the complements
          { display: 'background', start: DAY_1 + 'T10:00:00', end: DAY_1 + 'T11:00:00', resourceId: 'b', className: 'plain' },
        ],
      })
      let aFills = getBgEventEls(getLaneEl(calendar, 'a', DAY_1))
      let bFills = getBgEventEls(getLaneEl(calendar, 'b', DAY_1))

      expect(aFills.length).toBe(3) // 0-2, 4-6, 8-24
      expect(bFills.length).toBe(4) // the plain one, 0-6, 8-24, and g2's whole day
      expect(bFills[0].classList).toContain('plain')
      expect(bFills.slice(1).some((fillEl) => fillEl.classList.contains('plain'))).toBe(false)
    })
  })
})

// Utils
// -------------------------------------------------------------------------------------------------

// a timed 2-3am event, or an all-day one. keys are omitted rather than undefined: refiners would
// stringify an undefined resourceId
function buildEvent(props: {
  className?: string
  date: string
  allDay?: boolean
  resourceId?: string
  resourceIds?: string[]
  display?: string
}) {
  let event: any = {
    title: props.className || 'event',
    ...(props.allDay
      ? { start: props.date, allDay: true }
      : { start: props.date + 'T02:00:00', end: props.date + 'T03:00:00' }),
  }

  for (let key of ['className', 'resourceId', 'resourceIds', 'display']) {
    if (props[key] !== undefined) {
      event[key] = props[key]
    }
  }

  return event
}

function buildSelection(isTimed: boolean, startDay: string, endDay: string) {
  return isTimed
    ? { start: startDay + 'T02:00:00', end: startDay + 'T04:00:00' }
    : { start: startDay, end: endDay, allDay: true }
}

function getHeader(calendar: Calendar, family: 'timeGrid' | 'dayGrid') {
  return family === 'timeGrid'
    ? new ResourceTimeGridViewWrapper(calendar).header
    : new ResourceDayGridViewWrapper(calendar).header
}

// the distinct resources in the header, in order (the wrapper's getResourceIds repeats a resource
// for each of its date cells with resources above dates)
function getHeaderResourceIds(calendar: Calendar, family: 'timeGrid' | 'dayGrid'): string[] {
  let ids: string[] = []

  for (let id of getHeader(calendar, family).getResourceIds()) {
    if (ids.indexOf(id) === -1) {
      ids.push(id)
    }
  }

  return ids
}

// a timeGrid column. resourceId null for a placeholder
function getLaneEl(calendar: Calendar, resourceId: string | null, date: string): HTMLElement {
  return calendar.el.querySelector(
    `.fc-timegrid-day[role=cell][data-date="${date}"]` +
    (resourceId ? `[data-resource-id="${resourceId}"]` : ':not([data-resource-id])'),
  ) as HTMLElement
}

// a resource dayGrid body cell, or a resource timeGrid all-day cell
function getDayCellEl(calendar: Calendar, resourceId: string | null, date: string): HTMLElement {
  return calendar.el.querySelector(
    `.fc-daygrid-day[role=cell][data-date="${date}"]` +
    (resourceId ? `[data-resource-id="${resourceId}"]` : ':not([data-resource-id])'),
  ) as HTMLElement
}

const getAllDayCellEl = getDayCellEl

function getColumnEl(calendar: Calendar, family: 'timeGrid' | 'dayGrid', resourceId: string | null, date: string): HTMLElement {
  return family === 'timeGrid'
    ? getLaneEl(calendar, resourceId, date)
    : getDayCellEl(calendar, resourceId, date)
}

function countBgEventsInColumn(calendar: Calendar, family: 'timeGrid' | 'dayGrid', resourceId: string | null, date: string): number {
  return getBgEventEls(getColumnEl(calendar, family, resourceId, date)).length
}

function countNonBusinessInColumn(calendar: Calendar, family: 'timeGrid' | 'dayGrid', resourceId: string | null, date: string): number {
  return getNonBusinessEls(getColumnEl(calendar, family, resourceId, date)).length
}

function countHighlightsInColumn(calendar: Calendar, family: 'timeGrid' | 'dayGrid', resourceId: string | null, date: string): number {
  let columnEl = getColumnEl(calendar, family, resourceId, date)

  return columnEl ? findElements(columnEl, '.fc-highlight').length : 0
}

function getFgEventEls(el: HTMLElement): HTMLElement[] {
  return findElements(el, '.fc-event:not(.fc-bg-event):not(.fc-event-mirror)')
}

function getFgEventElsInCell(calendar: Calendar, resourceId: string, date: string): HTMLElement[] {
  return getFgEventEls(getDayCellEl(calendar, resourceId, date))
}

function getMirrorEls(el: HTMLElement, selector = ''): HTMLElement[] {
  return findElements(el, '.fc-event-mirror' + selector)
}

function getBgEventEls(el: HTMLElement): HTMLElement[] {
  return findElements(el, '.fc-bg-event')
}

function getNonBusinessEls(el: HTMLElement): HTMLElement[] {
  return findElements(el, '.fc-non-business')
}

function getEventKind(eventEl: HTMLElement): string {
  return eventEl.classList.contains('single') ? 'single' : 'recurring'
}

function getEventColor(eventEl: HTMLElement | undefined): string | null {
  return eventEl ? eventEl.style.getPropertyValue('--fc-event-color') : null
}

function expectSegFlags(eventEl: HTMLElement, isStart: boolean, isEnd: boolean) {
  expect(eventEl).toBeTruthy()
  expect(eventEl.classList.contains(CalendarWrapper.EVENT_IS_START_CLASSNAME)).toBe(isStart)
  expect(eventEl.classList.contains(CalendarWrapper.EVENT_IS_END_CLASSNAME)).toBe(isEnd)
}

const PX_TOLERANCE = 5 // borders and event margins

function expectElSpansCells(el: HTMLElement, firstCellEl: HTMLElement, lastCellEl: HTMLElement) {
  let rect = el.getBoundingClientRect()
  let firstRect = firstCellEl.getBoundingClientRect()
  let lastRect = lastCellEl.getBoundingClientRect()
  let left = Math.min(firstRect.left, lastRect.left)
  let right = Math.max(firstRect.right, lastRect.right)

  expect(Math.abs(rect.left - left)).toBeLessThan(PX_TOLERANCE)
  expect(Math.abs(rect.right - right)).toBeLessThan(PX_TOLERANCE)
}

function expectElWithinEl(el: HTMLElement, containerEl: HTMLElement) {
  let rect = el.getBoundingClientRect()
  let containerRect = containerEl.getBoundingClientRect()

  expect(rect.left).toBeGreaterThanOrEqual(containerRect.left - PX_TOLERANCE)
  expect(rect.right).toBeLessThanOrEqual(containerRect.right + PX_TOLERANCE)
}

// the same resources, filtered view-wide only (a resource timeline), are all present
function expectSurvivesViewWideFiltering(calendar: Calendar, resourceIds: string[]) {
  let viewType = calendar.view.type

  calendar.changeView('resourceTimelineWeek')
  expect(new ResourceTimelineViewWrapper(calendar).dataGrid.getResourceIds()).toEqual(resourceIds)
  calendar.changeView(viewType)
}

function getElCenter(el: Element) {
  let rect = el.getBoundingClientRect()

  return {
    left: (rect.left + rect.right) / 2,
    top: (rect.top + rect.bottom) / 2,
  }
}

function simulatePointerDrag(point, end?) {
  return new Promise<void>((resolve) => {
    $.simulateByPoint('drag', {
      point,
      ...(end ? { end } : {}),
      callback() {
        resolve()
      },
    })
  })
}

// onBeforeRelease runs after the last move, with the drag's mirrors rendered. An error thrown in it
// is kept until the release, so the drag always ends (an abandoned drag hangs the whole run)
function simulateElDrag(
  el: HTMLElement,
  end,
  onBeforeRelease?: () => void,
  localPoint: { left: string | number, top: string | number } = { left: '50%', top: 5 },
) {
  return new Promise<void>((resolve, reject) => {
    let error: unknown = null

    $(el).simulate('drag', {
      localPoint,
      end,
      onBeforeRelease() {
        try {
          if (onBeforeRelease) {
            onBeforeRelease()
          }
        } catch (e) {
          error = e
        }
      },
      onRelease: () => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      },
    })
  })
}

function simulateTouchPress(el: HTMLElement) {
  return new Promise<void>((resolve) => {
    $(el).simulate('drag', {
      isTouch: true,
      delay: 200, // past longPressDelay
      dx: 0,
      dy: 0,
      onRelease: () => resolve(),
    })
  })
}
