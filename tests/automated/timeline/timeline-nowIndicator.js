import { getBoundingRect } from 'fullcalendar/tests/automated/lib/dom-geom'
import { getTimelineLine } from '../lib/timeline'

describe('timeline now-indicator', function() {
  pushOptions({
    defaultView: 'timelineDay',
    now: '2015-12-26T02:30:00',
    nowIndicator: true,
    scrollTime: '00:00'
  })

  describeOptions('isRTL', {
    'when LTR': false
    // 'when RTL': true # wasn't working with headless. TODO: come back and fix
  }, function() {

    describeOptions('resources', {
      'when no resources': null,
      'when resources': [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' }
      ]
    }, function() {

      it('doesn\'t render when out of view', function(done) {
        initCalendar({
          defaultDate: '2015-12-27T02:30:00' // next day
        })
        setTimeout(function() { // wait for scroll
          expect(getNowIndicatorRenders()).toBe(false)
          done()
        })
      })

      it('renders when in view', function(done) {
        initCalendar()
        setTimeout(function() { // wait for scroll
          nowIndicatorRendersAt('2015-12-26T02:30:00')
          done()
        })
      })
    })
  })

  it('refreshes at intervals', function(done) {
    initCalendar({
      now: '2015-12-26T00:00:00',
      defaultView: 'timelineOneMinute',
      views: {
        timelineOneMinute: {
          type: 'timeline',
          duration: { minutes: 1 },
          slotDuration: { seconds: 1 }
        }
      }
    })
    setTimeout(function() {
      nowIndicatorRendersAt('2015-12-26T00:00:01')
      setTimeout(function() {
        nowIndicatorRendersAt('2015-12-26T00:00:02')
        done()
      }, 1000)
    }, 1000)
  })

  it('refreshes on resize when slot width changes', function(done) {
    initCalendar({
      defaultView: 'timeline6hour',
      views: {
        timeline6hour: {
          type: 'timeline',
          duration: { hours: 6 },
          slotDuration: { minutes: 30 }
        }
      }
    })
    nowIndicatorRendersAt('2015-12-26T02:30:00')
    $('#calendar').width('50%')
    $(window).trigger('resize') // simulate the window resize, even tho the container is just resizing
    setTimeout(function() {
      nowIndicatorRendersAt('2015-12-26T02:30:00')
      $('#calendar').width('') // undo
      done()
    }, 500)
  })


  function getNowIndicatorRenders() {
    return $('.fc-timeline .fc-now-indicator').length > 0
  }

  function nowIndicatorRendersAt(date, thresh) {
    // wish threshold could do a smaller default threshold, but RTL messing up
    if (thresh == null) { thresh = 3 }
    const line = getTimelineLine(date)
    const arrowRect = getBoundingRect('.fc-timeline .fc-now-indicator-arrow')
    const lineRect = getBoundingRect('.fc-timeline .fc-now-indicator-line')
    expect(Math.abs(
      ((arrowRect.left + arrowRect.right) / 2) -
      line.left
    )).toBeLessThan(thresh)
    expect(Math.abs(
      ((lineRect.left + lineRect.right) / 2) -
      line.left
    )).toBeLessThan(thresh)
  }
})
