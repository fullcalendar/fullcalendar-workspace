
describe('column-view resourceLabelDidMount trigger', function() { // TODO: rename the file
  pushOptions({
    now: '2016-02-13',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    views: {
      resourceTimeGridThreeDay: {
        type: 'resourceTimeGrid',
        duration: { days: 3 }
      },
      resourceDayGridThreeDay: {
        type: 'resourceDayGrid',
        duration: { days: 3 }
      }
    }
  })

  describeOptions('dir', {
    'when LTR': 'ltr',
    'when RTL': 'rtl'
  }, function() {

    describe('when resource above dates', function() {
      pushOptions({
        datesAboveResources: false
      })

      describeOptions('defaultView', {
        'when timeGrid view': 'resourceTimeGridThreeDay',
        'when dayGrid view': 'resourceDayGridThreeDay',
        'when month view': 'resourceDayGridMonth'
      }, function() {

        it('fires once per resources', function() {
          let callCnt = 0
          initCalendar({
            resourceLabelDidMount(arg) {
              if (arg.resource.id === 'a') {
                expect(arg.el instanceof HTMLTableCellElement).toBe(true)
                expect(arg.el).toContainText('Resource A')
                callCnt++
              }
            }
          })
          expect(callCnt).toBe(1)
        })
      })
    })

    describe('when dates above resource', function() {
      pushOptions({
        datesAboveResources: true
      })

      describeOptions('defaultView', {
        'when timeGrid view': 'resourceTimeGridThreeDay',
        'when dayGrid view': 'resourceDayGridThreeDay'
      }, function() {

        it('fires onces per day', function() {
          let callCnt = 0
          initCalendar({
            resourceLabelDidMount(arg) {
              if (arg.resource.id === 'a') {
                expect(arg.el instanceof HTMLTableCellElement).toBe(true)
                expect(arg.el).toContainText('Resource A')
                callCnt++
              }
            }
          })
          expect(callCnt).toBe(3)
        })
      })

      describe('when month view', function() {
        pushOptions({
          defaultView: 'resourceDayGridMonth'
        })

        it('fires onces per day', function() {
          let callCnt = 0
          initCalendar({
            resourceLabelDidMount(arg) {
              if (arg.resource.id === 'a') {
                expect(arg.el instanceof HTMLTableCellElement).toBe(true)
                expect(arg.el).toContainText('Resource A')
                callCnt++
              }
            }
          })
          expect(callCnt).toBe(7) // 7 days of the week
        })
      })
    })
  })
})
