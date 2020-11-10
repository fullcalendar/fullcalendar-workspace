import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('slotLabelFormat', () => {
  pushOptions({
    initialView: 'timelineWeek',
  })

  describe('as an array', () => {
    it('renders multiple levels', () => {
      let calendar = initCalendar({
        slotDuration: { hours: 1 },
        slotLabelFormat: [
          { month: 'numeric', day: 'numeric' },
          { hour: 'numeric', minute: 'numeric' },
        ],
      })

      let headerWrapper = new TimelineViewWrapper(calendar).header

      expect(headerWrapper.getDateRowCnt()).toBe(2)
    })
  })
})
