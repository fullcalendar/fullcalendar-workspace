import { getTimeGridResourceIds } from '../lib/time-grid'
import { getTimelineResourceIds } from '../lib/timeline'

describe('Resource::remove', function() {
  pushOptions({
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
      { id: 'c', title: 'c' }
    ]
  })

  describeOptions('defaultView', {
    'when in timeline view': 'resourceTimelineDay',
    'when in timeGrid view': 'resourceTimeGridDay'
  }, function(viewName) {

    const getResourceIds =
      viewName === 'resourceTimelineDay'
        ? getTimelineResourceIds
        : getTimeGridResourceIds

    it('works when called quick succession', function() {
      initCalendar()
      expect(getResourceIds()).toEqual([ 'a', 'b', 'c' ])

      currentCalendar.getResourceById('a').remove()
      expect(getResourceIds()).toEqual([ 'b', 'c' ])

      currentCalendar.getResourceById('b').remove()
      expect(getResourceIds()).toEqual([ 'c' ])

      currentCalendar.getResourceById('c').remove()
      expect(getResourceIds()).toEqual([])
    })
  })
})
