import { joinRects } from 'package-tests/lib/geom'
import { getBoundingRect, getLeadingBoundingRect, getTrailingBoundingRect } from 'package-tests/lib/dom-geom'
import { getHeadResourceEls, getHeadDowEls, getBodyDowEls } from '../lib/column'

describe('vresource structure', function() {
  pushOptions({
    now: '2015-11-16'
  })

  describeValues({
    'with resourceTimeGrid views': 'resourceTimeGrid',
    'with resourceDayGrid views': 'resourceDayGrid'
  }, function(baseViewType) {

    pushOptions({
      views: {
        oneDay: { type: baseViewType, duration: { days: 1 } },
        twoDay: { type: baseViewType, duration: { days: 2 } }
      },
      scrollTime: '00:00',
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
        { id: 'c', title: 'Resource C' },
        { id: 'd', title: 'Resource D' }
      ]
    })

    describe('when one-day', function() {
      pushOptions({
        defaultView: 'oneDay'
      })

      describe('when LTR', function() {
        pushOptions({
          dir: 'ltr'
        })

        it('renders cells right-to-left', function(callback) {
          initCalendar({
            datesRender() {
              const aRect = getBoundingRect(getHeadResourceEls('a'))
              const bRect = getBoundingRect(getHeadResourceEls('b'))
              const cRect = getBoundingRect(getHeadResourceEls('c'))
              const dRect = getBoundingRect(getHeadResourceEls('d'))
              expect(aRect).toBeMostlyLeftOf(bRect)
              expect(bRect).toBeMostlyLeftOf(cRect)
              expect(cRect).toBeMostlyLeftOf(dRect)
              expect(getBodyDowEls('mon', baseViewType).length).toBe(4)
              callback()
            }
          })
        })
      })

      describe('when RTL', function() {
        pushOptions({
          dir: 'rtl'
        })

        it('renders cells left-to-right', function(callback) {
          initCalendar({
            datesRender() {
              const aRect = getBoundingRect(getHeadResourceEls('a'))
              const bRect = getBoundingRect(getHeadResourceEls('b'))
              const cRect = getBoundingRect(getHeadResourceEls('c'))
              const dRect = getBoundingRect(getHeadResourceEls('d'))
              expect(aRect).toBeMostlyRightOf(bRect)
              expect(bRect).toBeMostlyRightOf(cRect)
              expect(cRect).toBeMostlyRightOf(dRect)
              expect(getBodyDowEls('mon', baseViewType).length).toBe(4)
              callback()
            }
          })
        })
      })
    })

    describe('with two-day', function() {
      pushOptions({
        defaultView: 'twoDay'
      })

      describe('when resources are above dates', function() {
        pushOptions({
          datesAboveResources: false
        })

        it('renders cells correctly', function(callback) {
          initCalendar({
            datesRender() {
              const aEl = getHeadResourceEls('a')
              const aRect = getBoundingRect(aEl)
              const monEls = getHeadDowEls('mon')
              const tuesEls = getHeadDowEls('tue')
              expect(monEls.length).toBe(4)
              expect(tuesEls.length).toBe(4)
              const monRect = getBoundingRect(monEls.eq(0))
              expect(aRect).toBeMostlyAbove(monRect)
              expect(getBodyDowEls('mon', baseViewType).length).toBe(4)
              expect(getBodyDowEls('tue', baseViewType).length).toBe(4)
              callback()
            }
          })
        })
      })

      describe('when dates are above resources', function() {
        pushOptions({
          datesAboveResources: true
        })

        it('renders cells correctly', function(callback) {
          initCalendar({
            datesRender() {
              const monEl = getHeadDowEls('mon')
              const monRect = getBoundingRect(monEl)
              expect(monEl.length).toBe(1)
              const aEls = getHeadResourceEls('a')
              const bEls = getHeadResourceEls('b')
              expect(aEls.length).toBe(2)
              expect(bEls.length).toBe(2)
              const aRect = getBoundingRect(aEls.eq(0))
              expect(monRect).toBeMostlyAbove(aRect)
              expect(getBodyDowEls('mon', baseViewType).length).toBe(4)
              expect(getBodyDowEls('tue', baseViewType).length).toBe(4)
              callback()
            }
          })
        })
      })
    })

    describe('when no groupBy settings specified', function() {

      describe('when one-day', function() {
        pushOptions({
          defaultView: 'oneDay'
        })

        it('renders resources columns', function(callback) {
          initCalendar({
            datesRender() {
              expect(getHeadResourceEls('a').length).toBe(1)
              expect(getHeadResourceEls('b').length).toBe(1)
              expect(getHeadResourceEls('c').length).toBe(1)
              expect(getHeadResourceEls('d').length).toBe(1)
              callback()
            }
          })
        })
      })
    })

    describe('when delay in resource fetching', function() {
      pushOptions({
        defaultView: 'oneDay',
        resources(arg, callback) {
          setTimeout(function() {
            callback([
              { id: 'a', title: 'Resource A' },
              { id: 'b', title: 'Resource B' }
            ])
          }, 200)
        }
      })

      xit('renders progressively', function(callback) {
        let firstCallbackHeight = null

        const firstCallback = function() {
          expect(getHeadResourceEls('a').length).toBe(0)
          expect(getHeadResourceEls('b').length).toBe(0)
          firstCallbackHeight = $('.fc-view-container').outerHeight()
        }

        initCalendar({
          datesRender() {
            expect(getHeadResourceEls('a').length).toBe(1)
            expect(getHeadResourceEls('b').length).toBe(1)

            expect(firstCallbackHeight).toBeGreaterThan(100)
            expect(Math.abs(
              firstCallbackHeight - $('.fc-view-container').outerHeight()
            )).toBeLessThan(1)

            callback()
          }
        })

        setTimeout(firstCallback, 100)
      })
    })
  })

  describe('when month view', function() {
    pushOptions({
      defaultView: 'resourceDayGridMonth',
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' }
      ]
    })

    describeOptions('dir', {
      'when LTR': 'ltr',
      'when RTL': 'rtl'
    }, function(dir) {

      it('renders side-by-side months', function(callback) {
        initCalendar({
          datesRender() {
            expect(getHeadResourceEls('a').length).toBe(1)
            expect(getHeadResourceEls('b').length).toBe(1)
            expect(getHeadDowEls('sun').length).toBe(2)
            expect($('.fc-body .fc-row').length).toBe(6)
            const firstADayRect = getLeadingBoundingRect('td[data-date="2015-11-01"]', dir)
            const lastADayRect = getLeadingBoundingRect('td[data-date="2015-12-12"]', dir)
            const firstBDayRect = getTrailingBoundingRect('td[data-date="2015-11-01"]', dir)
            const lastBDayRect = getTrailingBoundingRect('td[data-date="2015-12-12"]', dir)
            const aDayRect = joinRects(firstADayRect, lastADayRect)
            aDayRect.right -= 1 // might share a pixel
            aDayRect.left += 1 // ditto, but for rtl
            const bDayRect = joinRects(firstBDayRect, lastBDayRect)
            if (dir === 'rtl') {
              expect(aDayRect).toBeRightOf(bDayRect)
            } else {
              expect(aDayRect).toBeLeftOf(bDayRect)
            }
            callback()
          }
        })
      })
    })
  })
})
