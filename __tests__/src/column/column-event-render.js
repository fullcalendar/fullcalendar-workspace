import { getBoundingRect, getLeadingBoundingRect, getTrailingBoundingRect } from 'package-tests/lib/dom-geom'
import { getHeadResourceEls, getHeadDowEls } from '../lib/column'

describe('vresource event rendering', function() {
  pushOptions({
    now: '2015-11-17',
    scrollTime: '00:00',
    views: {
      resourceTimeGridTwoDay: {
        type: 'resourceTimeGrid',
        duration: { days: 2 }
      },
      resourceDayGridTwoDay: {
        type: 'resourceDayGrid',
        duration: { days: 2 }
      }
    },
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' }
    ]
  })

  describeOptions('dir', {
    'when LTR': 'ltr',
    'when RTL': 'rtl'
  }, function(dir) {

    describeValues({
      'with normal event': null,
      'with background events': 'background'
    }, function(renderingType) {

      describe('with a single-day event', function() {

        describeOptions({
          'when resourceTimeGridTwoDay': {
            defaultView: 'resourceTimeGridTwoDay',
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
          'when resourceDayGridTwoDay': {
            defaultView: 'resourceDayGridTwoDay',
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
              datesAboveResources: false
            })

            it('renders in the correct column', function(callback) {
              initCalendar({
                _eventsPositioned() {
                  const colRect = getTrailingBoundingRect(getHeadDowEls('tue'), dir)
                  const eventRect = getBoundingRect('.event1')
                  expect(eventRect).toBeMostlyHBoundedBy(colRect)
                  callback()
                }
              })
            })
          })

          describe('when dates above resources', function() {
            pushOptions({
              datesAboveResources: true
            })

            it('renders in the correct column', function(callback) {
              initCalendar({
                _eventsPositioned() {
                  const resourceRect = getLeadingBoundingRect(getHeadResourceEls('c'), dir)
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

        describe('when resourceTimeGridTwoDay', function() {
          pushOptions({
            defaultView: 'resourceTimeGridTwoDay',
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
              datesAboveResources: false
            })

            it('renders in the correct columns', function(callback) {
              initCalendar({
                _eventsPositioned() {
                  const eventEls = $('.event1')
                  expect(eventEls.length).toBe(2)
                  const firstEventRect = getLeadingBoundingRect(eventEls, dir)
                  const lastEventRect = getTrailingBoundingRect(eventEls, dir)
                  if (!renderingType) { // non-background events
                    expect(firstEventRect.node).toHaveClass('fc-start')
                    expect(lastEventRect.node).toHaveClass('fc-end')
                  }
                  const tueRect = getTrailingBoundingRect(getHeadDowEls('tue'), dir)
                  const wedRect = getTrailingBoundingRect(getHeadDowEls('wed'), dir)
                  expect(firstEventRect).toBeMostlyHBoundedBy(tueRect)
                  expect(lastEventRect).toBeMostlyHBoundedBy(wedRect)
                  callback()
                }
              })
            })
          })

          describe('when dates above resources', function() {
            pushOptions({
              datesAboveResources: true
            })

            it('renders in the correct columns', function(callback) {
              initCalendar({
                _eventsPositioned() {
                  const eventEls = $('.event1')
                  expect(eventEls.length).toBe(2)
                  const firstEventRect = getLeadingBoundingRect(eventEls, dir)
                  const lastEventRect = getTrailingBoundingRect(eventEls, dir)
                  if (!renderingType) { // non-background events
                    expect(firstEventRect.node).toHaveClass('fc-start')
                    expect(lastEventRect.node).toHaveClass('fc-end')
                  }
                  const resourceEls = getHeadResourceEls('c')
                  const firstResourceRect = getLeadingBoundingRect(resourceEls, dir)
                  const lastResourceRect = getTrailingBoundingRect(resourceEls, dir)
                  expect(firstEventRect).toBeMostlyHBoundedBy(firstResourceRect)
                  expect(lastEventRect).toBeMostlyHBoundedBy(lastResourceRect)
                  callback()
                }
              })
            })
          })
        })

        describe('when resourceDayGridTwoDay', function() {
          pushOptions({
            defaultView: 'resourceDayGridTwoDay',
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
              datesAboveResources: false
            })

            it('renders in the correct columns', function(callback) {
              initCalendar({
                _eventsPositioned() {
                  const eventRect = getBoundingRect('.event1')
                  const tueRect = getTrailingBoundingRect(getHeadDowEls('tue'), dir)
                  const wedRect = getTrailingBoundingRect(getHeadDowEls('wed'), dir)
                  expect(tueRect).toBeMostlyHBoundedBy(eventRect)
                  expect(wedRect).toBeMostlyHBoundedBy(eventRect)
                  callback()
                }
              })
            })
          })

          describe('when dates above resources', function() {
            pushOptions({
              datesAboveResources: true
            })

            it('renders in the correct columns', function(callback) {
              initCalendar({
                _eventsPositioned() {
                  const eventEls = $('.event1')
                  expect(eventEls.length).toBe(2)
                  const firstEventRect = getLeadingBoundingRect(eventEls, dir)
                  const lastEventRect = getTrailingBoundingRect(eventEls, dir)
                  if (!renderingType) { // non-background events
                    expect(firstEventRect.node).toHaveClass('fc-start')
                    expect(lastEventRect.node).toHaveClass('fc-end')
                  }
                  const resourceEls = getHeadResourceEls('c')
                  const firstResourceRect = getLeadingBoundingRect(resourceEls, dir)
                  const lastResourceRect = getTrailingBoundingRect(resourceEls, dir)
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
          'when resourceTimeGridTwoDay': {
            defaultView: 'resourceTimeGridTwoDay',
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
          'when resourceDayGridTwoDay': {
            defaultView: 'resourceDayGridTwoDay',
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
              datesAboveResources: false
            },
            'when dates above resources': {
              datesAboveResources: true
            }
          }, function() {

            if (renderingType === 'background') {

              it('renders on every resource', function(callback) {
                initCalendar({
                  _eventsPositioned() {
                    const eventEls = $('.event1')
                    expect(eventEls.length).toBe(3)
                    callback()
                  }
                })
              })
            } else {

              it('doesn\'t render at all', function(callback) {
                initCalendar({
                  _eventsPositioned() {
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
        defaultView: 'resourceTimeGridDay',
        _eventsPositioned() {
          expect($('.event1').length).toBe(2)
          done()
        }
      })
    })

    it('renders a single event when no resource columns', function(done) {
      initCalendar({
        defaultView: 'timeGridTwoDay',
        views: {
          timeGridTwoDay: {
            type: 'timeGrid',
            duration: { days: 2 }
          }
        },
        _eventsPositioned() {
          expect($('.event1').length).toBe(1)
          done()
        }
      })
    })
  })
})
