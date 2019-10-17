import { doElsMatchSegs } from 'package-tests/lib/segs'
import { getResourceDayGridRect } from '../lib/day-grid'
import { getResourceTimeGridRect } from '../lib/time-grid'

describe('vresource businessHours', function() {
  pushOptions({
    now: '2015-11-18',
    scrollTime: '00:00',
    businessHours: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ]
  })

  describeOptions('dir', {
    'when LTR': 'ltr',
    'when RTL': 'rtl'
  }, function() {

    describe('for resourceDayGridWeek', function() {
      pushOptions({
        defaultView: 'resourceDayGridWeek'
      })

      describeOptions({
        'when resources above dates': { datesAboveResources: false },
        'when dates above resources': { datesAboveResources: true }
      }, function() {

        it('greys out sat and sun', function(done) {
          initCalendar({
            datesRender() {
              expect(isDayGridNonBusinessSegsRendered([
                { resourceId: 'a', date: '2015-11-15' },
                { resourceId: 'a', date: '2015-11-21' },
                { resourceId: 'b', date: '2015-11-15' },
                { resourceId: 'b', date: '2015-11-21' }
              ])).toBe(true)
              done()
            }
          })
        })
      })
    })

    describe('for week', function() {
      pushOptions({
        defaultView: 'resourceTimeGridWeek'
      })

      describeOptions({
        'when resources above dates': { datesAboveResources: false },
        'when dates above resources': { datesAboveResources: true }
      }, function() {

        it('greys out sat and sun', function(done) {
          initCalendar({
            datesRender() {
              expect(isResourceTimeGridNonBusinessSegsRendered([
                // sun
                { resourceId: 'a', start: '2015-11-15T00:00:00', end: '2015-11-16T00:00:00' },
                // mon
                { resourceId: 'a', start: '2015-11-16T00:00:00', end: '2015-11-16T09:00:00' },
                { resourceId: 'a', start: '2015-11-16T17:00:00', end: '2015-11-17T00:00:00' },
                // tue
                { resourceId: 'a', start: '2015-11-17T00:00:00', end: '2015-11-17T09:00:00' },
                { resourceId: 'a', start: '2015-11-17T17:00:00', end: '2015-11-18T00:00:00' },
                // wed
                { resourceId: 'a', start: '2015-11-18T00:00:00', end: '2015-11-18T09:00:00' },
                { resourceId: 'a', start: '2015-11-18T17:00:00', end: '2015-11-19T00:00:00' },
                // thu
                { resourceId: 'a', start: '2015-11-19T00:00:00', end: '2015-11-19T09:00:00' },
                { resourceId: 'a', start: '2015-11-19T17:00:00', end: '2015-11-20T00:00:00' },
                // fru
                { resourceId: 'a', start: '2015-11-20T00:00:00', end: '2015-11-20T09:00:00' },
                { resourceId: 'a', start: '2015-11-20T17:00:00', end: '2015-11-21T00:00:00' },
                // sat
                { resourceId: 'a', start: '2015-11-21T00:00:00', end: '2015-11-22T00:00:00' },
                // sun
                { resourceId: 'b', start: '2015-11-15T00:00:00', end: '2015-11-16T00:00:00' },
                // mon
                { resourceId: 'b', start: '2015-11-16T00:00:00', end: '2015-11-16T09:00:00' },
                { resourceId: 'b', start: '2015-11-16T17:00:00', end: '2015-11-17T00:00:00' },
                // tue
                { resourceId: 'b', start: '2015-11-17T00:00:00', end: '2015-11-17T09:00:00' },
                { resourceId: 'b', start: '2015-11-17T17:00:00', end: '2015-11-18T00:00:00' },
                // wed
                { resourceId: 'b', start: '2015-11-18T00:00:00', end: '2015-11-18T09:00:00' },
                { resourceId: 'b', start: '2015-11-18T17:00:00', end: '2015-11-19T00:00:00' },
                // thu
                { resourceId: 'b', start: '2015-11-19T00:00:00', end: '2015-11-19T09:00:00' },
                { resourceId: 'b', start: '2015-11-19T17:00:00', end: '2015-11-20T00:00:00' },
                // fri
                { resourceId: 'b', start: '2015-11-20T00:00:00', end: '2015-11-20T09:00:00' },
                { resourceId: 'b', start: '2015-11-20T17:00:00', end: '2015-11-21T00:00:00' },
                // sat
                { resourceId: 'b', start: '2015-11-21T00:00:00', end: '2015-11-22T00:00:00' }
              ])).toBe(true)
              done()
            }
          })
        })
      })
    })

    describe('for day with resources', function() {
      pushOptions({
        defaultView: 'resourceTimeGridDay'
      })

      it('renders all with same businessHours', function(done) {
        initCalendar({
          datesRender() {
            expectDay9to5()
            done()
          }
        })
      })

      it('renders a resource override', function(done) {
        initCalendar({
          resources: [
            { id: 'a', title: 'Resource A' },
            { id: 'b', title: 'Resource B', businessHours: { startTime: '02:00', endTime: '22:00' } }
          ],
          datesRender() {
            expectResourceOverride()
            done()
          }
        })
      })

      it('renders a resource override dynamically', function(done) {
        let specialResourceInput = { id: 'b', title: 'Resource B', businessHours: { startTime: '02:00', endTime: '22:00' } }

        initCalendar({
          resources: [
            { id: 'a', title: 'Resource A' },
            specialResourceInput
          ],
          datesRender() {
            expectResourceOverride()
            currentCalendar.getResourceById(specialResourceInput.id).remove()

            setTimeout(function() {
              expectLonelyDay9to5()
              currentCalendar.addResource(specialResourceInput)

              setTimeout(function() {
                expectResourceOverride()
                done()
              }, 0)
            }, 0)
          }
        })
      })

      it('greys out whole day for single resource', function(done) {
        initCalendar({
          defaultDate: '2016-10-30', // a Sunday
          businessHours: false,
          resources: [
            { id: 'a', title: 'Resource A' },
            { id: 'b',
              title: 'Resource B',
              businessHours: [
                { startTime: '08:00', endTime: '18:00', daysOfWeek: [ 1, 2, 3, 4, 5 ] }
              ] }
          ],
          datesRender() {
            expect(isResourceTimeGridNonBusinessSegsRendered([
              { resourceId: 'b', start: '2016-10-30T00:00', end: '2016-10-31T00:00' }
            ])).toBe(true)
            done()
          }
        })
      })
    })
  })

  function expectDay9to5() {
    expect(isResourceTimeGridNonBusinessSegsRendered([
      { resourceId: 'a', start: '2015-11-18T00:00', end: '2015-11-18T09:00' },
      { resourceId: 'a', start: '2015-11-18T17:00', end: '2015-11-19T00:00' },
      { resourceId: 'b', start: '2015-11-18T00:00', end: '2015-11-18T09:00' },
      { resourceId: 'b', start: '2015-11-18T17:00', end: '2015-11-19T00:00' }
    ])).toBe(true)
  }

  function expectResourceOverride() { // one resource 2am - 10pm, the rest 9am - 5pm
    expect(isResourceTimeGridNonBusinessSegsRendered([
      { resourceId: 'a', start: '2015-11-18T00:00', end: '2015-11-18T09:00' },
      { resourceId: 'a', start: '2015-11-18T17:00', end: '2015-11-19T00:00' },
      { resourceId: 'b', start: '2015-11-18T00:00', end: '2015-11-18T02:00' },
      { resourceId: 'b', start: '2015-11-18T22:00', end: '2015-11-19T00:00' }
    ])).toBe(true)
  }

  function expectLonelyDay9to5() { // only one resource 9am - 5pm
    expect(isResourceTimeGridNonBusinessSegsRendered([
      { resourceId: 'a', start: '2015-11-18T00:00', end: '2015-11-18T09:00' },
      { resourceId: 'a', start: '2015-11-18T17:00', end: '2015-11-19T00:00' }
    ])).toBe(true)
  }

  function isDayGridNonBusinessSegsRendered(segs) {
    return doElsMatchSegs($('.fc-day-grid .fc-nonbusiness'), segs, getResourceDayGridRect)
  }

  function isResourceTimeGridNonBusinessSegsRendered(segs) {
    return doElsMatchSegs($('.fc-time-grid .fc-nonbusiness'), segs, getResourceTimeGridRect)
  }
})
