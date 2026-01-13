import { strictModeFactor } from '@fullcalendar/core/vdom'

describe('column-view resourceDayHeaderDidMount trigger', () => { // TODO: rename the file
  pushOptions({
    now: '2016-02-13',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    views: {
      resourceTimeGridThreeDay: {
        type: 'resourceTimeGrid',
        duration: { days: 3 },
      },
      resourceDayGridThreeDay: {
        type: 'resourceDayGrid',
        duration: { days: 3 },
      },
    },
  })

  describeOptions('direction', {
    'when LTR': 'ltr',
    'when RTL': 'rtl',
  }, () => {
    describe('when resource above dates', () => {
      pushOptions({
        datesAboveResources: false,
      })

      describeOptions('initialView', {
        'when timeGrid view': 'resourceTimeGridThreeDay',
        'when dayGrid view': 'resourceDayGridThreeDay',
        'when month view': 'resourceDayGridMonth',
      }, () => {
        it('fires once per resources', () => {
          let callCnt = 0
          initCalendar({
            resourceDayHeaderDidMount(data) {
              if (data.resource.id === 'a') {
                expect(data.el).toContainText('Resource A')
                callCnt += 1
              }
            },
          })
          expect(callCnt).toBe(1 * strictModeFactor)
        })
      })
    })

    describe('when dates above resource', () => {
      pushOptions({
        datesAboveResources: true,
      })

      describeOptions('initialView', {
        'when timeGrid view': 'resourceTimeGridThreeDay',
        'when dayGrid view': 'resourceDayGridThreeDay',
      }, () => {
        it('fires onces per day', () => {
          let callCnt = 0
          initCalendar({
            resourceDayHeaderDidMount(data) {
              if (data.resource.id === 'a') {
                expect(data.el).toContainText('Resource A')
                callCnt += 1
              }
            },
          })
          expect(callCnt).toBe(3 * strictModeFactor)
        })
      })

      describe('when month view', () => {
        pushOptions({
          initialView: 'resourceDayGridMonth',
        })

        it('fires onces per day', () => {
          let callCnt = 0
          initCalendar({
            resourceDayHeaderDidMount(data) {
              if (data.resource.id === 'a') {
                expect(data.el).toContainText('Resource A')
                callCnt += 1
              }
            },
          })
          expect(callCnt).toBe(7 * strictModeFactor) // 7 days of the week
        })
      })
    })
  })
})
