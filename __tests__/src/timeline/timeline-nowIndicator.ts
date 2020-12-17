import { getBoundingRect } from 'fullcalendar-tests/src/lib/dom-geom'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

/*
RIDICULOUSLY BIG THRESHOLD, because IE/Edge have setInterval issues.
TODO: make a more bulletproof way
*/
const PIXEL_THRESHOLD = 30

describe('timeline now-indicator', () => {
  pushOptions({
    initialView: 'timelineDay',
    now: '2015-12-26T02:30:00',
    nowIndicator: true,
    scrollTime: '00:00',
  })

  describeOptions('direction', {
    'when LTR': 'ltr',
    'when RTL': 'rtl',
  }, () => {
    describeOptions('resources', {
      'when no resources': null,
      'when resources': [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
    }, (resources) => {
      let ViewWrapper = resources ? ResourceTimelineViewWrapper : TimelineViewWrapper

      it('doesn\'t render when out of view', () => {
        let calendar = initCalendar({
          initialView: resources ? 'resourceTimelineDay' : 'timelineDay',
          initialDate: '2015-12-27T02:30:00', // next day
        })
        let hasNowIndicator = new ViewWrapper(calendar).hasNowIndicator()
        expect(hasNowIndicator).toBe(false)
      })

      it('renders when in view', () => {
        initCalendar()
        nowIndicatorRendersAt('2015-12-26T02:30:00')
      })
    })
  })

  it('refreshes at intervals', (done) => {
    initCalendar({
      now: '2015-12-26T00:00:00',
      initialView: 'timelineOneMinute',
      views: {
        timelineOneMinute: {
          type: 'timeline',
          duration: { minutes: 1 },
          slotDuration: { seconds: 1 },
        },
      },
    })
    setTimeout(() => {
      nowIndicatorRendersAt('2015-12-26T00:00:01')
      setTimeout(() => {
        nowIndicatorRendersAt('2015-12-26T00:00:02')
        done()
      }, 1000)
    }, 1000)
  })

  it('refreshes on resize when slot width changes', (done) => {
    initCalendar({
      initialView: 'timeline6hour',
      views: {
        timeline6hour: {
          type: 'timeline',
          duration: { hours: 6 },
          slotDuration: { minutes: 30 },
        },
      },
    })
    nowIndicatorRendersAt('2015-12-26T02:30:00')
    $('#calendar').width('50%')
    $(window).trigger('resize') // simulate the window resize, even tho the container is just resizing
    setTimeout(() => {
      nowIndicatorRendersAt('2015-12-26T02:30:00')
      $('#calendar').width('') // undo
      done()
    }, 500)
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5999
  it('positions correctly when with month-interval cells', (done) => {
    initCalendar({
      initialView: 'timelineYear',
      slotDuration: { months: 1 },
      initialDate: '2020-11-28',
      now: '2020-12-02',
    })

    setTimeout(() => { // bug happens after position updates
      nowIndicatorRendersAt('2020-12-01')
      done()
    }, 100)
  })

  function nowIndicatorRendersAt(date, thresh = PIXEL_THRESHOLD) {
    // wish threshold could do a smaller default threshold, but RTL messing up

    let viewWrapper = new TimelineViewWrapper(currentCalendar)
    let line = viewWrapper.timelineGrid.getLine(date)
    let arrowRect = getBoundingRect(viewWrapper.header.getNowIndicatorEl())
    let lineRect = getBoundingRect(viewWrapper.timelineGrid.getNowIndicatorEl())

    expect(Math.abs(
      ((arrowRect.left + arrowRect.right) / 2) -
      line.left,
    )).toBeLessThan(thresh)

    expect(Math.abs(
      ((lineRect.left + lineRect.right) / 2) -
      line.left,
    )).toBeLessThan(thresh)
  }
})
