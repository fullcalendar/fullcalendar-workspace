import { getBoundingRect, getLeadingBoundingRect, getTrailingBoundingRect } from 'fullcalendar/tests/automated/lib/dom-geom'
import { getHeadResourceEls, getHeadDowEls } from '../lib/column'

describe('vresource event rendering', function() {
  pushOptions({
    now: '2015-11-17',
    scrollTime: '00:00',
    views: {
      agendaTwoDay: {
        type: 'agenda',
        duration: { days: 2 }
      },
      basicTwoDay: {
        type: 'basic',
        duration: { days: 2 }
      }
    },
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' }
    ]
  })

  describeOptions('isRTL', {
    'when LTR': false,
    'when RTL': true
  }, function(isRTL) {

    describeValues({
      'with normal event': null,
      'with background events': 'background'
    }, function(renderingType) {

      describe('with a single-day event', function() {

        describeOptions({
          'when agendaTwoDay': {
            defaultView: 'agendaTwoDay',
            events: [
              {
                title: 'event 1',
                className: 'event1',
                start: '2015-11-17T12:00:00',
                end: '2015-11-17T02:00:00',
                resourceId: 'c',
                rendering: renderingType
              }
            ]
          },
          'when basicTwoDay': {
            defaultView: 'basicTwoDay',
            events: [
              {
                title: 'event 1',
                className: 'event1',
                start: '2015-11-17',
                end: '2015-11-18',
                resourceId: 'c',
                rendering: renderingType
              }
            ]
          }
        }, function() {

          describe('when resources above dates', function() {
            pushOptions({
              groupByResource: true
            })

            it('renders in the correct column', function(callback) {
              initCalendar({
                eventAfterAllRender() {
                  const colRect = getTrailingBoundingRect(getHeadDowEls('tue'), isRTL)
                  const eventRect = getBoundingRect('.event1')
                  expect(eventRect).toBeMostlyHBoundedBy(colRect)
                  callback()
                }
              })
            })
          })

          describe('when dates above resources', function() {
            pushOptions({
              groupByDateAndResource: true
            })

            it('renders in the correct column', function(callback) {
              initCalendar({
                eventAfterAllRender() {
                  const resourceRect = getLeadingBoundingRect(getHeadResourceEls('c'), isRTL)
                  const eventRect = getBoundingRect('.event1')
                  expect(eventRect).toBeMostlyHBoundedBy(resourceRect)
                  callback()
                }
              })
            })
          })
        })
      })

      describe('when a multi-day event', function() {

        describe('when agendaTwoDay', function() {
          pushOptions({
            defaultView: 'agendaTwoDay',
            events: [
              {
                title: 'event 1',
                className: 'event1',
                start: '2015-11-17T12:00:00',
                end: '2015-11-18T12:00:00',
                resourceId: 'c',
                rendering: renderingType
              }
            ]
          })

          describe('when resources above dates', function() {
            pushOptions({
              groupByResource: true
            })

            it('renders in the correct columns', function(callback) {
              initCalendar({
                eventAfterAllRender() {
                  const eventEls = $('.event1')
                  expect(eventEls.length).toBe(2)
                  const firstEventRect = getLeadingBoundingRect(eventEls, isRTL)
                  const lastEventRect = getTrailingBoundingRect(eventEls, isRTL)
                  if (!renderingType) { // non-background events
                    expect(firstEventRect.node).toHaveClass('fc-start')
                    expect(lastEventRect.node).toHaveClass('fc-end')
                  }
                  const tueRect = getTrailingBoundingRect(getHeadDowEls('tue'), isRTL)
                  const wedRect = getTrailingBoundingRect(getHeadDowEls('wed'), isRTL)
                  expect(firstEventRect).toBeMostlyHBoundedBy(tueRect)
                  expect(lastEventRect).toBeMostlyHBoundedBy(wedRect)
                  callback()
                }
              })
            })
          })

          describe('when dates above resources', function() {
            pushOptions({
              groupByDateAndResource: true
            })

            it('renders in the correct columns', function(callback) {
              initCalendar({
                eventAfterAllRender() {
                  const eventEls = $('.event1')
                  expect(eventEls.length).toBe(2)
                  const firstEventRect = getLeadingBoundingRect(eventEls, isRTL)
                  const lastEventRect = getTrailingBoundingRect(eventEls, isRTL)
                  if (!renderingType) { // non-background events
                    expect(firstEventRect.node).toHaveClass('fc-start')
                    expect(lastEventRect.node).toHaveClass('fc-end')
                  }
                  const resourceEls = getHeadResourceEls('c')
                  const firstResourceRect = getLeadingBoundingRect(resourceEls, isRTL)
                  const lastResourceRect = getTrailingBoundingRect(resourceEls, isRTL)
                  expect(firstEventRect).toBeMostlyHBoundedBy(firstResourceRect)
                  expect(lastEventRect).toBeMostlyHBoundedBy(lastResourceRect)
                  callback()
                }
              })
            })
          })
        })

        describe('when basicTwoDay', function() {
          pushOptions({
            defaultView: 'basicTwoDay',
            events: [
              {
                title: 'event 1',
                className: 'event1',
                start: '2015-11-17',
                end: '2015-11-19',
                resourceId: 'c',
                rendering: renderingType
              }
            ]
          })

          describe('when resources above dates', function() {
            pushOptions({
              groupByResource: true
            })

            it('renders in the correct columns', function(callback) {
              initCalendar({
                eventAfterAllRender() {
                  const eventRect = getBoundingRect('.event1')
                  const tueRect = getTrailingBoundingRect(getHeadDowEls('tue'), isRTL)
                  const wedRect = getTrailingBoundingRect(getHeadDowEls('wed'), isRTL)
                  expect(tueRect).toBeMostlyHBoundedBy(eventRect)
                  expect(wedRect).toBeMostlyHBoundedBy(eventRect)
                  callback()
                }
              })
            })
          })

          describe('when dates above resources', function() {
            pushOptions({
              groupByDateAndResource: true
            })

            it('renders in the correct columns', function(callback) {
              initCalendar({
                eventAfterAllRender() {
                  const eventEls = $('.event1')
                  expect(eventEls.length).toBe(2)
                  const firstEventRect = getLeadingBoundingRect(eventEls, isRTL)
                  const lastEventRect = getTrailingBoundingRect(eventEls, isRTL)
                  if (!renderingType) { // non-background events
                    expect(firstEventRect.node).toHaveClass('fc-start')
                    expect(lastEventRect.node).toHaveClass('fc-end')
                  }
                  const resourceEls = getHeadResourceEls('c')
                  const firstResourceRect = getLeadingBoundingRect(resourceEls, isRTL)
                  const lastResourceRect = getTrailingBoundingRect(resourceEls, isRTL)
                  expect(firstEventRect).toBeMostlyHBoundedBy(firstResourceRect)
                  expect(lastEventRect).toBeMostlyHBoundedBy(lastResourceRect)
                  callback()
                }
              })
            })
          })
        })
      })

      describe('with an event with no resources', function() {

        describeOptions({
          'when agendaTwoDay': {
            defaultView: 'agendaTwoDay',
            events: [
              {
                title: 'event 1',
                className: 'event1',
                start: '2015-11-17T12:00:00',
                end: '2015-11-17T02:00:00',
                rendering: renderingType
              }
            ]
          },
          'when basicTwoDay': {
            defaultView: 'basicTwoDay',
            events: [
              {
                title: 'event 1',
                className: 'event1',
                start: '2015-11-17',
                end: '2015-11-18',
                rendering: renderingType
              }
            ]
          }
        }, function() {

          describeOptions({
            'when resources above dates': {
              groupByResource: true
            },
            'when dates above resources': {
              groupByDateAndResource: true
            }
          }, function() {

            if (renderingType === 'background') {

              it('renders on every resource', function(callback) {
                initCalendar({
                  eventAfterAllRender() {
                    const eventEls = $('.event1')
                    expect(eventEls.length).toBe(3)
                    callback()
                  }
                })
              })
            } else {

              it('doesn\'t render at all', function(callback) {
                initCalendar({
                  eventAfterAllRender() {
                    const eventEls = $('.event1')
                    expect(eventEls.length).toBe(0)
                    callback()
                  }
                })
              })
            }
          })
        })
      })
    })
  })

  describe('with an event with multiple', function() {
    pushOptions({
      events: [{
        title: 'event 1',
        className: 'event1',
        start: '2015-11-17T01:00:00',
        end: '2015-11-17T05:00:00',
        resourceIds: [ 'a', 'b' ]
      }]
    })

    it('renders each event in a separate resource column', function(done) {
      initCalendar({
        defaultView: 'agendaDay',
        eventAfterAllRender() {
          expect($('.event1').length).toBe(2)
          done()
        }
      })
    })

    it('renders a single event when no resource columns', function(done) {
      initCalendar({
        defaultView: 'agendaTwoDay',
        eventAfterAllRender() {
          expect($('.event1').length).toBe(1)
          done()
        }
      })
    })
  })
})
