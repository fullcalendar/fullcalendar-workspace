import { startOfDay } from '@fullcalendar/core'
import lvLocale from '@fullcalendar/core/locales/lv'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('timeline rendering', () => {
  pushOptions({
    initialDate: '2017-10-27',
  })

  function buildResources(cnt) {
    let resources = []
    for (let i = 0; i < cnt; i += 1) {
      resources.push({ title: `resource${i}` })
    }
    return resources
  }

  it('has correct vertical scroll and gutters', () => {
    let calendar = initCalendar({
      initialView: 'resourceTimeline',
      resources: buildResources(50),
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

  it('renders time slots localized', () => {
    let calendar = initCalendar({
      initialView: 'timelineWeek',
      slotDuration: '01:00',
      scrollTime: 0,
      locale: lvLocale,
    })
    let headerWrapper = new TimelineViewWrapper(calendar).header

    expect(
      headerWrapper.getCellInfo()[0].date,
    ).toEqualDate('2017-10-23T00:00:00') // start-of-week is a Monday, lv
  })

  it('call slotLabelDidMount for each day', () => {
    let callCnt = 0

    initCalendar({
      initialView: 'timelineWeek',
      slotDuration: { days: 1 },
      slotLabelDidMount(arg) {
        expect(arg.date instanceof Date).toBe(true)
        expect(arg.el instanceof HTMLElement).toBe(true)
        expect(typeof arg.view).toBe('object')
        callCnt += 1
      },
    })

    expect(callCnt).toBe(7)
  })

  it('call slotLabelDidMount for each hour', () => {
    let callCnt = 0

    initCalendar({
      initialView: 'timelineDay',
      slotDuration: { hours: 1 },
      slotLabelDidMount(arg) {
        expect(startOfDay(arg.date)).toEqualDate('2017-10-27')
        callCnt += 1
      },
    })

    expect(callCnt).toBe(24)
  })

  it('includes a level property in slotLabelContent', () => {
    let levelHash = {}

    initCalendar({
      initialView: 'timelineWeek',
      slotLabelFormat: [
        { day: 'numeric' },
        { hour: 'numeric', minute: 'numeric' },
      ],
      slotLabelContent(info) {
        expect(typeof info.level).toBe('number')
        levelHash[info.level] = true
      },
    })

    let levels = Object.keys(levelHash).sort()
    expect(levels).toEqual(['0', '1'])
  })

  // TODO: add test for implied week navlinks too
  it('renders axis with navLinks even when customized', () => {
    let calendar = initCalendar({
      initialView: 'timelineMonth',
      navLinks: true,
      slotLabelFormat() {
        return 'test'
      },
    })

    let headerWrapper = new TimelineViewWrapper(calendar).header
    let cellInfo = headerWrapper.getCellInfo()

    expect(cellInfo[0].hasNavLink).toBe(true)
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5545
  it('is sized correctly when height:auto and resources loaded on delay', (done) => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      height: 'auto',
      resources(fetchInfo, success) {
        setTimeout(() => {
          success(buildResources(20))
        }, 100)
      },
    })

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let dataGridWrapper = viewWrapper.dataGrid
    let timelineGridWrapper = viewWrapper.timelineGrid

    setTimeout(() => {
      let dataGridHeight = dataGridWrapper.getRootEl().offsetHeight
      let timelineGridHeight = timelineGridWrapper.getRootEl().offsetHeight
      expect(Math.abs(dataGridHeight - timelineGridHeight)).toBeLessThan(1)
      done()
    }, 200)
  })
})
