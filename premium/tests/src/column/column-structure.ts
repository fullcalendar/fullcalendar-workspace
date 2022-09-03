import { joinRects } from 'fullcalendar-tests/src/lib/geom'
import { getBoundingRect, getLeadingBoundingRect, getTrailingBoundingRect } from 'fullcalendar-tests/src/lib/dom-geom'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('vresource structure', () => {
  pushOptions({
    now: '2015-11-16',
  })

  describeValues({
    'with resourceTimeGrid views': 'resourceTimeGrid',
    'with resourceDayGrid views': 'resourceDayGrid',
  }, (baseViewType) => {
    let ViewWrapper = baseViewType.match(/^resourceDayGrid/) ? ResourceDayGridViewWrapper : ResourceTimeGridViewWrapper

    pushOptions({
      views: {
        oneDay: { type: baseViewType, duration: { days: 1 } },
        twoDay: { type: baseViewType, duration: { days: 2 } },
      },
      scrollTime: '00:00',
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
        { id: 'c', title: 'Resource C' },
        { id: 'd', title: 'Resource D' },
      ],
    })

    describe('when one-day', () => {
      pushOptions({
        initialView: 'oneDay',
      })

      describe('when LTR', () => {
        pushOptions({
          direction: 'ltr',
        })

        it('renders cells right-to-left', () => {
          let calendar = initCalendar()
          let viewWrapper = new ViewWrapper(calendar)
          let headerWrapper = viewWrapper.header
          let dayGridWrapper = viewWrapper.dayGrid // TODO: test timeGrid too

          const aRect = getBoundingRect(headerWrapper.getResourceEls('a'))
          const bRect = getBoundingRect(headerWrapper.getResourceEls('b'))
          const cRect = getBoundingRect(headerWrapper.getResourceEls('c'))
          const dRect = getBoundingRect(headerWrapper.getResourceEls('d'))
          expect(aRect).toBeMostlyLeftOf(bRect)
          expect(bRect).toBeMostlyLeftOf(cRect)
          expect(cRect).toBeMostlyLeftOf(dRect)
          expect(dayGridWrapper.getDowEls('mon').length).toBe(4)
        })
      })

      describe('when RTL', () => {
        pushOptions({
          direction: 'rtl',
        })

        it('renders cells left-to-right', () => {
          let calendar = initCalendar()
          let viewWrapper = new ViewWrapper(calendar)
          let headerWrapper = viewWrapper.header
          let dayGridWrapper = viewWrapper.dayGrid // TODO: test timeGrid too

          const aRect = getBoundingRect(headerWrapper.getResourceEls('a'))
          const bRect = getBoundingRect(headerWrapper.getResourceEls('b'))
          const cRect = getBoundingRect(headerWrapper.getResourceEls('c'))
          const dRect = getBoundingRect(headerWrapper.getResourceEls('d'))
          expect(aRect).toBeMostlyRightOf(bRect)
          expect(bRect).toBeMostlyRightOf(cRect)
          expect(cRect).toBeMostlyRightOf(dRect)
          expect(dayGridWrapper.getDowEls('mon').length).toBe(4)
        })
      })
    })

    describe('with two-day', () => {
      pushOptions({
        initialView: 'twoDay',
      })

      describe('when resources are above dates', () => {
        pushOptions({
          datesAboveResources: false,
        })

        it('renders cells correctly', () => {
          let calendar = initCalendar()
          let viewWrapper = new ViewWrapper(calendar)
          let headerWrapper = viewWrapper.header
          let dayGridWrapper = viewWrapper.dayGrid // TODO: test timeGrid too

          const aEl = headerWrapper.getResourceEls('a')
          const aRect = getBoundingRect(aEl)
          const monEls = headerWrapper.getDowEls('mon')
          const tuesEls = headerWrapper.getDowEls('tue')
          expect(monEls.length).toBe(4)
          expect(tuesEls.length).toBe(4)
          const monRect = getBoundingRect(monEls[0])
          expect(aRect).toBeMostlyAbove(monRect)
          expect(dayGridWrapper.getDowEls('mon').length).toBe(4)
          expect(dayGridWrapper.getDowEls('tue').length).toBe(4)
        })
      })

      describe('when dates are above resources', () => {
        pushOptions({
          datesAboveResources: true,
        })

        it('renders cells correctly', () => {
          let calendar = initCalendar()
          let viewWrapper = new ViewWrapper(calendar)
          let headerWrapper = viewWrapper.header
          let dayGridWrapper = viewWrapper.dayGrid // TODO: test timeGrid too

          const monEl = headerWrapper.getDowEls('mon')
          const monRect = getBoundingRect(monEl)
          expect(monEl.length).toBe(1)
          const aEls = headerWrapper.getResourceEls('a')
          const bEls = headerWrapper.getResourceEls('b')
          expect(aEls.length).toBe(2)
          expect(bEls.length).toBe(2)
          const aRect = getBoundingRect(aEls[0])
          expect(monRect).toBeMostlyAbove(aRect)
          expect(dayGridWrapper.getDowEls('mon').length).toBe(4)
          expect(dayGridWrapper.getDowEls('tue').length).toBe(4)
        })
      })
    })

    describe('when no groupBy settings specified', () => {
      describe('when one-day', () => {
        pushOptions({
          initialView: 'oneDay',
        })

        it('renders resources columns', () => {
          let calendar = initCalendar()
          let headerWrapper = new ViewWrapper(calendar).header

          expect(headerWrapper.getResourceEls('a').length).toBe(1)
          expect(headerWrapper.getResourceEls('b').length).toBe(1)
          expect(headerWrapper.getResourceEls('c').length).toBe(1)
          expect(headerWrapper.getResourceEls('d').length).toBe(1)
        })
      })
    })

    describe('when delay in resource fetching', () => {
      pushOptions({
        initialView: 'oneDay',
        resources(arg, callback) {
          setTimeout(() => {
            callback([
              { id: 'a', title: 'Resource A' },
              { id: 'b', title: 'Resource B' },
            ])
          }, 200)
        },
      })
    })
  })

  describe('when month view', () => {
    pushOptions({
      initialView: 'resourceDayGridMonth',
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
    })

    describeOptions('direction', {
      'when LTR': 'ltr',
      'when RTL': 'rtl',
    }, (direction) => {
      it('renders side-by-side months', () => {
        let calendar = initCalendar()
        let viewWrapper = new ResourceDayGridViewWrapper(calendar)
        let headerWrapper = viewWrapper.header
        let dayGridWrapper = viewWrapper.dayGrid

        expect(headerWrapper.getResourceEls('a').length).toBe(1)
        expect(headerWrapper.getResourceEls('b').length).toBe(1)
        expect(headerWrapper.getDowEls('sun').length).toBe(2)
        expect(dayGridWrapper.getRowEls().length).toBe(6)

        const firstADayRect = getLeadingBoundingRect('td[data-date="2015-11-01"]', direction)
        const lastADayRect = getLeadingBoundingRect('td[data-date="2015-12-12"]', direction)
        const firstBDayRect = getTrailingBoundingRect('td[data-date="2015-11-01"]', direction)
        const lastBDayRect = getTrailingBoundingRect('td[data-date="2015-12-12"]', direction)
        const aDayRect = joinRects(firstADayRect, lastADayRect)
        aDayRect.right -= 1 // might share a pixel
        aDayRect.left += 1 // ditto, but for rtl
        const bDayRect = joinRects(firstBDayRect, lastBDayRect)

        if (direction === 'rtl') {
          expect(aDayRect).toBeRightOf(bDayRect)
        } else {
          expect(aDayRect).toBeLeftOf(bDayRect)
        }
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5684
  it('resyncs header row heights when horizontal scrolling and dynamic resources', (done) => {
    let calendar = initCalendar({
      initialView: 'resourceTimeGridWeek',
      dayMinWidth: 350,
      weekNumbers: true, // i think this is necessary to recreate the bug too
      resources(info, callback) {
        setTimeout(() => {
          callback([
            { id: 'a', title: 'Resource A ' },
            { id: 'b', title: 'Resource B' },
          ])
        }, 100)
      },
    })
    let viewWrapper = new ResourceTimeGridViewWrapper(calendar)

    setTimeout(() => {
      expect(
        viewWrapper.getHeaderAxisTable().offsetHeight,
      ).toBe(
        viewWrapper.header.getRootTableEl().offsetHeight,
      )

      expect(
        viewWrapper.getAllDayAxisTable().offsetHeight,
      ).toBe(
        viewWrapper.dayGrid.getRootTableEl().offsetHeight,
      )

      done()
    }, 200)
  })
})
