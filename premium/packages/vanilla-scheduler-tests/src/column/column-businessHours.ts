import { doElsMatchSegs } from '@fullcalendar-tests/standard/lib/segs'
import { waitTimeout, ignoreResizeObserverLoops } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

describe('vresource businessHours', () => {
  pushOptions({
    now: '2015-11-18',
    scrollTime: '00:00',
    businessHours: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  })

  describeOptions('direction', {
    'when LTR': 'ltr',
    'when RTL': 'rtl',
  }, () => {
    describe('for resourceDayGridWeek', () => {
      pushOptions({
        initialView: 'resourceDayGridWeek',
      })

      describeOptions({
        'when resources above dates': { datesAboveResources: false },
        'when dates above resources': { datesAboveResources: true },
      }, () => {
        it('greys out sat and sun', async () => {
          let calendar = initCalendar()
          await waitTimeout()
          expect(isDayGridNonBusinessSegsRendered(calendar, [
            { resourceId: 'a', date: '2015-11-15' },
            { resourceId: 'a', date: '2015-11-21' },
            { resourceId: 'b', date: '2015-11-15' },
            { resourceId: 'b', date: '2015-11-21' },
          ])).toBe(true)
        })
      })
    })

    describe('for week', () => {
      pushOptions({
        initialView: 'resourceTimeGridWeek',
      })

      describeOptions({
        'when resources above dates': { datesAboveResources: false },
        'when dates above resources': { datesAboveResources: true },
      }, () => {
        it('greys out sat and sun', async () => {
          let calendar = initCalendar()

          await ignoreResizeObserverLoops(async () => {
            await waitTimeout()
            expect(isResourceTimeGridNonBusinessSegsRendered(calendar, [
              // sun
              { resourceId: 'a', start: '2015-11-15T00:00:00', end: '2015-11-16T00:00:00' },
              // mon
              { resourceId: 'a', start: '2015-11-16T00:00:00', end: '2015-11-16T09:00:00' },
              { resourceId: 'a', start: '2015-11-16T17:00:00', end: '2015-11-17T00:00:00' },
              // tue
              { resourceId: 'a', start: '2015-11-17T00:00:00', end: '2015-11-17T09:00:00' },
              { resourceId: 'a', start: '2015-11-17T17:00:00', end: '2015-11-18T00:00:00' },
              // wed
              { resourceId: 'a', start: '2015-11-18T00:00:00', end: '2015-11-18T09:00:00' },
              { resourceId: 'a', start: '2015-11-18T17:00:00', end: '2015-11-19T00:00:00' },
              // thu
              { resourceId: 'a', start: '2015-11-19T00:00:00', end: '2015-11-19T09:00:00' },
              { resourceId: 'a', start: '2015-11-19T17:00:00', end: '2015-11-20T00:00:00' },
              // fru
              { resourceId: 'a', start: '2015-11-20T00:00:00', end: '2015-11-20T09:00:00' },
              { resourceId: 'a', start: '2015-11-20T17:00:00', end: '2015-11-21T00:00:00' },
              // sat
              { resourceId: 'a', start: '2015-11-21T00:00:00', end: '2015-11-22T00:00:00' },
              // sun
              { resourceId: 'b', start: '2015-11-15T00:00:00', end: '2015-11-16T00:00:00' },
              // mon
              { resourceId: 'b', start: '2015-11-16T00:00:00', end: '2015-11-16T09:00:00' },
              { resourceId: 'b', start: '2015-11-16T17:00:00', end: '2015-11-17T00:00:00' },
              // tue
              { resourceId: 'b', start: '2015-11-17T00:00:00', end: '2015-11-17T09:00:00' },
              { resourceId: 'b', start: '2015-11-17T17:00:00', end: '2015-11-18T00:00:00' },
              // wed
              { resourceId: 'b', start: '2015-11-18T00:00:00', end: '2015-11-18T09:00:00' },
              { resourceId: 'b', start: '2015-11-18T17:00:00', end: '2015-11-19T00:00:00' },
              // thu
              { resourceId: 'b', start: '2015-11-19T00:00:00', end: '2015-11-19T09:00:00' },
              { resourceId: 'b', start: '2015-11-19T17:00:00', end: '2015-11-20T00:00:00' },
              // fri
              { resourceId: 'b', start: '2015-11-20T00:00:00', end: '2015-11-20T09:00:00' },
              { resourceId: 'b', start: '2015-11-20T17:00:00', end: '2015-11-21T00:00:00' },
              // sat
              { resourceId: 'b', start: '2015-11-21T00:00:00', end: '2015-11-22T00:00:00' },
            ])).toBe(true)
          })
        })
      })
    })

    describe('for day with resources', () => {
      pushOptions({
        initialView: 'resourceTimeGridDay',
      })

      it('renders all with same businessHours', async () => {
        let calendar = initCalendar()
        await waitTimeout()
        expectDay9to5(calendar)
      })

      it('renders a resource override', async () => {
        let calendar = initCalendar({
          resources: [
            { id: 'a', title: 'Resource A' },
            { id: 'b', title: 'Resource B', businessHours: { startTime: '02:00', endTime: '22:00' } },
          ],
        })
        await waitTimeout()
        expectResourceOverride(calendar)
      })

      it('renders a resource override dynamically', async () => {
        let specialResourceInput = { id: 'b', title: 'Resource B', businessHours: { startTime: '02:00', endTime: '22:00' } }

        let calendar = initCalendar({
          resources: [
            { id: 'a', title: 'Resource A' },
            specialResourceInput,
          ],
        })

        await waitTimeout()
        expectResourceOverride(calendar)
        calendar.getResourceById(specialResourceInput.id).remove()

        await waitTimeout()
        expectLonelyDay9to5(calendar)
        calendar.addResource(specialResourceInput)

        await waitTimeout()
        expectResourceOverride(calendar)
      })

      it('greys out whole day for single resource', async () => {
        let calendar = initCalendar({
          initialDate: '2016-10-30', // a Sunday
          businessHours: false,
          resources: [
            { id: 'a', title: 'Resource A' },
            { id: 'b',
              title: 'Resource B',
              businessHours: [
                { startTime: '08:00', endTime: '18:00', daysOfWeek: [1, 2, 3, 4, 5] },
              ] },
          ],
        })
        await waitTimeout()
        expect(isResourceTimeGridNonBusinessSegsRendered(calendar, [
          { resourceId: 'b', start: '2016-10-30T00:00', end: '2016-10-31T00:00' },
        ])).toBe(true)
      })
    })
  })

  function expectDay9to5(calendar) {
    expect(isResourceTimeGridNonBusinessSegsRendered(calendar, [
      { resourceId: 'a', start: '2015-11-18T00:00', end: '2015-11-18T09:00' },
      { resourceId: 'a', start: '2015-11-18T17:00', end: '2015-11-19T00:00' },
      { resourceId: 'b', start: '2015-11-18T00:00', end: '2015-11-18T09:00' },
      { resourceId: 'b', start: '2015-11-18T17:00', end: '2015-11-19T00:00' },
    ])).toBe(true)
  }

  function expectResourceOverride(calendar) { // one resource 2am - 10pm, the rest 9am - 5pm
    expect(isResourceTimeGridNonBusinessSegsRendered(calendar, [
      { resourceId: 'a', start: '2015-11-18T00:00', end: '2015-11-18T09:00' },
      { resourceId: 'a', start: '2015-11-18T17:00', end: '2015-11-19T00:00' },
      { resourceId: 'b', start: '2015-11-18T00:00', end: '2015-11-18T02:00' },
      { resourceId: 'b', start: '2015-11-18T22:00', end: '2015-11-19T00:00' },
    ])).toBe(true)
  }

  function expectLonelyDay9to5(calendar) { // only one resource 9am - 5pm
    expect(isResourceTimeGridNonBusinessSegsRendered(calendar, [
      { resourceId: 'a', start: '2015-11-18T00:00', end: '2015-11-18T09:00' },
      { resourceId: 'a', start: '2015-11-18T17:00', end: '2015-11-19T00:00' },
    ])).toBe(true)
  }

  function isDayGridNonBusinessSegsRendered(calendar, segs) {
    let resourceDayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid

    return doElsMatchSegs(
      resourceDayGridWrapper.getNonBusinessDayEls(),
      segs,
      (seg) => {
        let dayEl = resourceDayGridWrapper.getDayEl(seg.resourceId, seg.date)
        return dayEl.getBoundingClientRect()
      },
    )
  }

  function isResourceTimeGridNonBusinessSegsRendered(calendar, segs) {
    let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

    return doElsMatchSegs(
      resourceTimeGridWrapper.getNonBusinessDayEls(),
      segs,
      resourceTimeGridWrapper.getRect.bind(resourceTimeGridWrapper),
    )
  }
})
