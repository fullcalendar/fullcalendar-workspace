import { Calendar, config } from '@fullcalendar/core'
import { CalendarWrapper } from 'fullcalendar-tests/src/lib/wrappers/CalendarWrapper'

describe('schedulerLicenseKey', () => {
  beforeEach(() => {
    config.mockSchedulerReleaseDate = '2011-06-06'
  })

  afterEach(() => {
    delete config.mockSchedulerReleaseDate
  })

  function defineTests() {
    it('is invalid when crap text', () => {
      let calendar = initCalendar({
        schedulerLicenseKey: '<%= versionReleaseDate %>',
      })
      expectInvalid(calendar)
    })

    it('is invalid when crap text when directly instantiating', () => {
      // just to see if it compiles with schedulerLicenseKey
      let calendar = new Calendar(document.getElementById('cal'), {
        ...getCurrentOptions(),
        schedulerLicenseKey: '<%= versionReleaseDate %>',
      })

      expect(calendar).toBeTruthy()
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

    it('is valid when GPL', () => {
      let calendar = initCalendar({
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
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
