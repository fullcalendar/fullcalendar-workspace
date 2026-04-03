import internalClassNames from 'fullcalendar/protected-styles'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimeGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/TimeGridViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('timegrid height with horizontal scrolling', () => {
  pushOptions({
    initialView: 'timeGridWeek',
    dayMinWidth: 300,
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5674
  it('syncs with expandRows', async () => {
    let calendar = initCalendar({
      slotDuration: '04:00',
      expandRows: true,
    })

    await waitTimeout()
    expectSlotsEqualHeight(calendar)
  })

  function expectSlotsEqualHeight(calendar) {
    let viewWrapper = new TimeGridViewWrapper(calendar)
    let rowElsByIndex = viewWrapper.getHeaderRowsGroupByRowIndex()

    for (const rowIndex in rowElsByIndex) {
      const rowEls = rowElsByIndex[rowIndex]

      expect(rowEls[0].offsetHeight).toBe(rowEls[1].offsetHeight)
    }
  }
})

describe('resource timegrid sticky footer scrollbar', () => {
  pushOptions({
    initialView: 'resourceTimeGridWeek',
    dayMinWidth: 350,
    weekNumbers: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  })

  it('ignores stickyFooterScrollbar when height is fixed', async () => {
    let calendar = initCalendar({
      height: 600,
      stickyFooterScrollbar: true,
    })

    await waitTimeout()

    expect(
      new ResourceTimeGridViewWrapper(calendar).el.querySelector(`.${internalClassNames.footerScrollbarSticky}`),
    ).toBe(null)
  })

  it('uses stickyFooterScrollbar when height is auto', async () => {
    let calendar = initCalendar({
      height: 'auto',
      stickyFooterScrollbar: true,
    })

    await waitTimeout()

    expect(
      new ResourceTimeGridViewWrapper(calendar).el.querySelector(`.${internalClassNames.footerScrollbarSticky}`),
    ).not.toBe(null)
  })
})
