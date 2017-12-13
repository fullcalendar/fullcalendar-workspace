import { getTimeGridResourceIds } from '../lib/time-grid'
import { getTimelineResourceIds } from '../lib/timeline'

describe('removeResource', function() {
  pushOptions({
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
      { id: 'c', title: 'c' }
    ]
  })

  describeOptions('defaultView', {
    'when in timeline view': 'timelineDay',
    'when in agenda view': 'agendaDay'
  }, function(viewName) {

    const getResourceIds =
      viewName === 'timelineDay'
        ? getTimelineResourceIds
        : getTimeGridResourceIds

    it('works when called quick succession', function() {
      initCalendar()
      expect(getResourceIds()).toEqual([ 'a', 'b', 'c' ])

      currentCalendar.removeResource('a')
      expect(getResourceIds()).toEqual([ 'b', 'c' ])

      currentCalendar.removeResource('b')
      expect(getResourceIds()).toEqual([ 'c' ])

      currentCalendar.removeResource('c')
      expect(getResourceIds()).toEqual([])
    })
  })
})
