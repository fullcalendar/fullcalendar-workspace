import { getBoundingRect } from 'standard-tests/src/lib/dom-geom'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

/*
RIDICULOUSLY BIG THRESHOLD, because IE/Edge have setInterval issues.
TODO: make a more bulletproof way
*/
const PIXEL_THRESHOLD = 30

describe('timeline now-indicator', function() {
  pushOptions({
    initialView: 'timelineDay',
    now: '2015-12-26T02:30:00',
    nowIndicator: true,
    scrollTime: '00:00'
  })

  describeOptions('direction', {
    'when LTR': 'ltr'
    // 'when RTL': 'rtl' # wasn't working with headless. TODO: come back and fix
  }, function() {

    describeOptions('resources', {
      'when no resources': null,
      'when resources': [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' }
      ]
    }, function(resources) {
      let ViewWrapper = resources ? ResourceTimelineViewWrapper : TimelineViewWrapper

      it('doesn\'t render when out of view', function() {
        let calendar = initCalendar({
          initialView: resources ? 'resourceTimelineDay' : 'timelineDay',
          initialDate: '2015-12-27T02:30:00' // next day
        })
        let hasNowIndicator = new ViewWrapper(calendar).hasNowIndicator()
        expect(hasNowIndicator).toBe(false)
      })

      it('renders when in view', function() {
        initCalendar()
        nowIndicatorRendersAt('2015-12-26T02:30:00')
      })
    })
  })

  it('refreshes at intervals', function(done) {
    initCalendar({
      now: '2015-12-26T00:00:00',
      initialView: 'timelineOneMinute',
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
      initialView: 'timeline6hour',
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


  function nowIndicatorRendersAt(date, thresh) {
    // wish threshold could do a smaller default threshold, but RTL messing up
    if (thresh == null) { thresh = PIXEL_THRESHOLD }

    let viewWrapper = new TimelineViewWrapper(currentCalendar)
    let line = viewWrapper.timelineGrid.getLine(date)
    let arrowRect = getBoundingRect(viewWrapper.header.getNowIndicatorEl())
    let lineRect = getBoundingRect(viewWrapper.timelineGrid.getNowIndicatorEl())

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
