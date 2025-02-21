import { Calendar } from '@fullcalendar/core'
import { config } from '@fullcalendar/core/internal'
import { CalendarWrapper } from '@fullcalendar-tests/standard/lib/wrappers/CalendarWrapper'

describe('schedulerLicenseKey', () => {
  beforeEach(() => {
    config.mockSchedulerReleaseDate = new Date('2011-06-06')
  })

  afterEach(() => {
    delete config.mockSchedulerReleaseDate
  })

  function defineTests() {
    it('is invalid when crap text', () => {
      let calendar = initCalendar({
        schedulerLicenseKey: '<%= someCrapText %>',
      })
      expectInvalid(calendar)
    })

    it('is invalid when crap text when directly instantiating', () => {
      let $calendarEl = $('<div>').appendTo('body')

      // just to see if it compiles with schedulerLicenseKey
      let calendar = new Calendar($calendarEl[0], {
        ...getCurrentOptions(),
        schedulerLicenseKey: '<%= someCrapText %>',
      })

      expect(calendar).toBeTruthy()
      $calendarEl.remove()
    })

    it('is invalid when purchased more than a year ago', () => {
      let calendar = initCalendar({
        schedulerLicenseKey: '1234567890-fcs-1273017600', // purchased on 2010-05-05
      })
      expectOutdated(calendar)
    })

    it('is valid when purchased less than a year ago', () => {
      let calendar = initCalendar({
        schedulerLicenseKey: '1234567890-fcs-1275868800', // purchased on 2010-06-07
      })
      expectValid(calendar)
    })

    it('is invalid when not 10 digits in random ID', () => {
      let calendar = initCalendar({
        schedulerLicenseKey: '123456789-fcs-1275868800', // purchased on 2010-06-07
      })
      expectInvalid(calendar)
    })

    it('is valid when Creative Commons', () => {
      let calendar = initCalendar({
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
      })
      expectValid(calendar)
    })

    it('is valid when AGPL', () => {
      let calendar = initCalendar({
        schedulerLicenseKey: 'AGPL-My-Frontend-And-Backend-Are-Open-Source',
      })
      expectValid(calendar)
    })
  }

  function expectValid(calendar) {
    let calendarWrapper = new CalendarWrapper(calendar)
    let message = Boolean(calendarWrapper.getLicenseMessage())
    return expect(message).toBe(false)
  }

  function expectOutdated(calendar) {
    let calendarWrapper = new CalendarWrapper(calendar)
    let message = calendarWrapper.getLicenseMessage()
    return expect(message && message.match(/old/i)).toBeTruthy()
  }

  function expectInvalid(calendar) {
    let calendarWrapper = new CalendarWrapper(calendar)
    let message = calendarWrapper.getLicenseMessage()
    return expect(message && message.match(/invalid/i)).toBeTruthy()
  }

  describe('when in a timeline view with resource', () => {
    pushOptions({
      initialView: 'resourceTimelineDay',
      resources: [{ id: 'a', title: 'Resource A' }],
    })
    defineTests()
  })

  describe('when in a timeline view no resource', () => {
    pushOptions({
      initialView: 'timelineDay',
    })
    defineTests()
  })

  describe('when in a month view', () => {
    pushOptions({
      initialView: 'dayGridMonth',
    })
    defineTests()
  })

  describeOptions('initialView', {
    'when timeline view': 'resourceTimelineDay',
    'when resource-timegrid view': 'resourceTimeGridDay',
    'when resource-daygrid view': 'resourceDayGridDay',
  }, () => {
    it('only renders one license message when view is rerendered', () => {
      let calendar = initCalendar({
        schedulerLicenseKey: '1234567890-fcs-1273017600', // purchased on 2010-05-05
        resources: [
          { id: 'a', title: 'Resource A' },
        ],
      })

      expectOutdated(calendar)
      currentCalendar.next()
      expectOutdated(calendar)
    })
  })
})
