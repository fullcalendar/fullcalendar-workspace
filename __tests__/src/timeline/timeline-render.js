import { startOfDay } from '@fullcalendar/core'
import lvLocale from '@fullcalendar/core/locales/lv'
import TimelineViewWrapper from '../lib/wrappers/TimelineViewWrapper'
import ResourceTimelineViewWrapper from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('timeline rendering', function() {
  pushOptions({
    defaultDate: '2017-10-27'
  })

  function buildResources(cnt) {
    let resources = []
    for (let i = 0; i < cnt; i++) {
      resources.push({ title: `resource${i}` })
    }
    return resources
  }


  it('has correct vertical scroll and gutters', function() {
    let calendar = initCalendar({
      defaultView: 'resourceTimeline',
      resources: buildResources(50)
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    let spreadsheetEl = viewWrapper.getDataScrollEl()
    let timeEl = viewWrapper.getTimeScrollEl()

    expect(spreadsheetEl.scrollHeight).toBeGreaterThan(0)
    expect(timeEl.scrollHeight).toBeGreaterThan(0)

    let gutter = timeEl.clientHeight - spreadsheetEl.clientHeight
    expect(spreadsheetEl.scrollHeight + gutter)
      .toEqual(timeEl.scrollHeight)
  })


  it('renders time slots localized', function() {
    let calendar = initCalendar({
      defaultView: 'timelineWeek',
      slotDuration: '01:00',
      scrollTime: 0,
      locale: lvLocale
    })
    let headerWrapper = new TimelineViewWrapper(calendar).header

    expect(
      headerWrapper.getCellInfo()[0].date
    ).toEqualDate('2017-10-23T00:00:00') // start-of-week is a Monday, lv
  })

  it('call dayRender for each day', function() {
    let callCnt = 0

    initCalendar({
      defaultView: 'timelineWeek',
      slotDuration: { days: 1 },
      dayRender(arg) {
        expect(arg.date instanceof Date).toBe(true)
        expect(arg.el instanceof HTMLElement).toBe(true)
        expect(typeof arg.view).toBe('object')
        callCnt++
      }
    })

    expect(callCnt).toBe(7)
  })

  it('call dayRender for each hour', function() {
    let callCnt = 0

    initCalendar({
      defaultView: 'timelineDay',
      slotDuration: { hours: 1 },
      dayRender(arg) {
        expect(startOfDay(arg.date)).toEqualDate('2017-10-27')
        callCnt++
      }
    })

    expect(callCnt).toBe(24)
  })
})
