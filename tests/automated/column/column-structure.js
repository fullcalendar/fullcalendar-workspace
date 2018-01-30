import { joinRects } from 'fullcalendar/tests/automated/lib/geom'
import { getBoundingRect, getLeadingBoundingRect, getTrailingBoundingRect } from 'fullcalendar/tests/automated/lib/dom-geom'
import { getHeadResourceEls, getHeadDowEls, getBodyDowEls } from '../lib/column'

describe('vresource structure', function() {
  pushOptions({
    now: '2015-11-16'
  })

  describeValues({
    'with agenda views': 'agenda',
    'with basic views': 'basic'
  }, function(viewType) {

    pushOptions({
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
        defaultView: viewType + 'Day'
      })

      describe('when LTR', function() {
        pushOptions({
          isRTL: false
        })

        it('renders cells right-to-left', function(callback) {
          initCalendar({
            viewRender() {
              const aRect = getBoundingRect(getHeadResourceEls('a'))
              const bRect = getBoundingRect(getHeadResourceEls('b'))
              const cRect = getBoundingRect(getHeadResourceEls('c'))
              const dRect = getBoundingRect(getHeadResourceEls('d'))
              expect(aRect).toBeMostlyLeftOf(bRect)
              expect(bRect).toBeMostlyLeftOf(cRect)
              expect(cRect).toBeMostlyLeftOf(dRect)
              expect(getBodyDowEls('mon', viewType).length).toBe(4)
              callback()
            }
          })
        })
      })

      describe('when RTL', function() {
        pushOptions({
          isRTL: true
        })

        it('renders cells left-to-right', function(callback) {
          initCalendar({
            viewRender() {
              const aRect = getBoundingRect(getHeadResourceEls('a'))
              const bRect = getBoundingRect(getHeadResourceEls('b'))
              const cRect = getBoundingRect(getHeadResourceEls('c'))
              const dRect = getBoundingRect(getHeadResourceEls('d'))
              expect(aRect).toBeMostlyRightOf(bRect)
              expect(bRect).toBeMostlyRightOf(cRect)
              expect(cRect).toBeMostlyRightOf(dRect)
              expect(getBodyDowEls('mon', viewType).length).toBe(4)
              callback()
            }
          })
        })
      })
    })

    describe('with two-day', function() {
      pushOptions({
        views: {
          twoDay: {
            type: viewType,
            duration: { days: 2 }
          }
        },
        defaultView: 'twoDay'
      })

      describe('when resources are above dates', function() {
        pushOptions({
          groupByResource: true,
          groupByDateAndResource: false // should be default
        })

        it('renders cells correctly', function(callback) {
          initCalendar({
            viewRender() {
              const aEl = getHeadResourceEls('a')
              const aRect = getBoundingRect(aEl)
              const monEls = getHeadDowEls('mon')
              const tuesEls = getHeadDowEls('tue')
              expect(monEls.length).toBe(4)
              expect(tuesEls.length).toBe(4)
              const monRect = getBoundingRect(monEls.eq(0))
              expect(aRect).toBeMostlyAbove(monRect)
              expect(getBodyDowEls('mon', viewType).length).toBe(4)
              expect(getBodyDowEls('tue', viewType).length).toBe(4)
              callback()
            }
          })
        })
      })

      describe('when dates are above resources', function() {
        pushOptions({
          groupByDateAndResource: true
        })

        it('renders cells correctly', function(callback) {
          initCalendar({
            viewRender() {
              const monEl = getHeadDowEls('mon')
              const monRect = getBoundingRect(monEl)
              expect(monEl.length).toBe(1)
              const aEls = getHeadResourceEls('a')
              const bEls = getHeadResourceEls('b')
              expect(aEls.length).toBe(2)
              expect(bEls.length).toBe(2)
              const aRect = getBoundingRect(aEls.eq(0))
              expect(monRect).toBeMostlyAbove(aRect)
              expect(getBodyDowEls('mon', viewType).length).toBe(4)
              expect(getBodyDowEls('tue', viewType).length).toBe(4)
              callback()
            }
          })
        })
      })
    })

    describe('when no groupBy settings specified', function() {

      describe('when one-day', function() {
        pushOptions({
          defaultView: viewType + 'Day'
        })

        it('renders resources columns', function(callback) {
          initCalendar({
            viewRender() {
              expect(getHeadResourceEls('a').length).toBe(1)
              expect(getHeadResourceEls('b').length).toBe(1)
              expect(getHeadResourceEls('c').length).toBe(1)
              expect(getHeadResourceEls('d').length).toBe(1)
              callback()
            }
          })
        })
      })

      describe('when one-week', function() {
        pushOptions({
          defaultView: viewType + 'Week'
        })

        it('renders resources columns', function(callback) {
          initCalendar({
            viewRender() {
              expect(getHeadResourceEls('a').length).toBe(0)
              expect(getHeadResourceEls('b').length).toBe(0)
              expect(getHeadResourceEls('c').length).toBe(0)
              expect(getHeadResourceEls('d').length).toBe(0)
              callback()
            }
          })
        })
      })
    })

    describe('when delay in resource fetching', function() {
      pushOptions({
        defaultView: viewType + 'Day',
        resources(callback) {
          setTimeout(function() {
            callback([
              { id: 'a', title: 'Resource A' },
              { id: 'b', title: 'Resource B' }
            ])
          }, 200)
        }
      })

      it('renders progressively', function(callback) {
        let firstCallbackHeight = null

        const firstCallback = function() {
          expect(getHeadResourceEls('a').length).toBe(0)
          expect(getHeadResourceEls('b').length).toBe(0)
          firstCallbackHeight = $('.fc-view-container').outerHeight()
        }

        initCalendar({
          viewRender() {
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
      defaultView: 'month',
      groupByResource: true,
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' }
      ]
    })

    describeOptions('isRTL', {
      'when LTR': false,
      'when RTL': true
    }, function(isRTL) {

      it('renders side-by-side months', function(callback) {
        initCalendar({
          viewRender() {
            expect(getHeadResourceEls('a').length).toBe(1)
            expect(getHeadResourceEls('b').length).toBe(1)
            expect(getHeadDowEls('sun').length).toBe(2)
            expect($('.fc-body .fc-row').length).toBe(6)
            const firstADayRect = getLeadingBoundingRect('td[data-date="2015-11-01"]', isRTL)
            const lastADayRect = getLeadingBoundingRect('td[data-date="2015-12-12"]', isRTL)
            const firstBDayRect = getTrailingBoundingRect('td[data-date="2015-11-01"]', isRTL)
            const lastBDayRect = getTrailingBoundingRect('td[data-date="2015-12-12"]', isRTL)
            const aDayRect = joinRects(firstADayRect, lastADayRect)
            aDayRect.right -= 1 // might share a pixel
            aDayRect.left += 1 // ditto, but for rtl
            const bDayRect = joinRects(firstBDayRect, lastBDayRect)
            if (isRTL) {
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
