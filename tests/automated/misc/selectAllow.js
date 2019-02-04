import { selectResourceTimeline } from '../lib/timeline'

describe('selectAllow', function() {
  pushOptions({
    now: '2016-09-04',
    defaultView: 'resourceTimelineWeek',
    scrollTime: '00:00',
    selectable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ]
  })

  it('disallows selecting when returning false', function(done) { // and given correct params
    let isCalled = false

    initCalendar({
      selectAllow(selectInfo) {
        expect(selectInfo.resource.id).toBe('b')
        isCalled = true
        return false
      }
    })

    selectResourceTimeline(
      { resourceId: 'b', date: '2016-09-04T03:00:00' },
      { resourceId: 'b', date: '2016-09-04T06:00:00' }
    ).then(function(selectInfo) {
      expect(selectInfo).toBeFalsy() // drop failure?
      expect(isCalled).toBe(true)
      done()
    })
  })

  it('allows selecting when returning false', function(done) {
    let isCalled = false

    initCalendar({
      selectAllow(selectInfo) {
        isCalled = true
        return true
      }
    })

    selectResourceTimeline(
      { resourceId: 'b', date: '2016-09-04T03:00:00' },
      { resourceId: 'b', date: '2016-09-04T06:00:00' }
    ).then(function(selectInfo) {
      expect(typeof selectInfo).toBe('object')
      expect(selectInfo.start).toEqualDate('2016-09-04T03:00:00Z')
      expect(selectInfo.end).toEqualDate('2016-09-04T07:00:00Z') // because hour slots
      expect(isCalled).toBe(true)
      done()
    })
  })
})
