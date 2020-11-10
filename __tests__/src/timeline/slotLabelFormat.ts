import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('slotLabelFormat', function() {
  pushOptions({
    initialView: 'timelineWeek'
  })

  describe('as an array', function() {
    it('renders multiple levels', function() {
      let calendar = initCalendar({
        slotDuration: { hours: 1 },
        slotLabelFormat: [
          { month: 'numeric', day: 'numeric' },
          { hour: 'numeric', minute: 'numeric' }
        ]
      })

      let headerWrapper = new TimelineViewWrapper(calendar).header

      expect(headerWrapper.getDateRowCnt()).toBe(2)
    })
  })

})
