import { TimeGridViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/TimeGridViewWrapper'

describe('timegrid height with horizontal scrolling', () => {
  pushOptions({
    initialView: 'timeGridWeek',
    dayMinWidth: 300,
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5600
  it('syncs the slats when themed', () => {
    let calendar = initCalendar({
      themeSystem: 'bootstrap', // doesn't actually work to be able effectively test this!
    })
    expectSlotsEqualHeight(calendar)
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5674
  it('syncs with expandRows', () => {
    let calendar = initCalendar({
      slotDuration: '04:00',
      expandRows: true,
    })
    expectSlotsEqualHeight(calendar)
  })

  function expectSlotsEqualHeight(calendar) {
    let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
    expect(timeGridWrapper.getMainSlotTable().offsetHeight).toBe(
      timeGridWrapper.getSeparateSlotAxisTable().offsetHeight,
    )
  }
})
