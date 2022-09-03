import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('Resource::remove', () => {
  pushOptions({
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
      { id: 'c', title: 'c' },
    ],
  })

  describeOptions('initialView', {
    'when in timeline view': 'resourceTimelineDay',
    'when in timeGrid view': 'resourceTimeGridDay',
  }, (viewName) => {
    it('works when called quick succession', () => {
      let calendar = initCalendar()

      expect(getResourceIds(calendar)).toEqual(['a', 'b', 'c'])

      currentCalendar.getResourceById('a').remove()
      expect(getResourceIds(calendar)).toEqual(['b', 'c'])

      currentCalendar.getResourceById('b').remove()
      expect(getResourceIds(calendar)).toEqual(['c'])

      currentCalendar.getResourceById('c').remove()
      expect(getResourceIds(calendar)).toEqual([])
    })

    function getResourceIds(calendar) {
      if (viewName === 'resourceTimelineDay') {
        return new ResourceTimelineViewWrapper(calendar).timelineGrid.getResourceIds()
      }
      return new ResourceTimeGridViewWrapper(calendar).timeGrid.getResourceIds()
    }
  })
})
