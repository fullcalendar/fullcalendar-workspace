import { config, Calendar } from '@fullcalendar/core'
import CalendarWrapper from 'standard-tests/src/lib/wrappers/CalendarWrapper'

describe('schedulerLicenseKey', function() {

  beforeEach(function() {
    config.mockSchedulerReleaseDate = '2011-06-06'
  })

  afterEach(function() {
    delete config.mockSchedulerReleaseDate
  })

  function defineTests() {

    it('is invalid when crap text', function() {
      let calendar = initCalendar({
        schedulerLicenseKey: '<%= versionReleaseDate %>'
      })
      expectIsValid(calendar, false)
    })

    it('is invalid when crap text when directly instantiating', function() {

      // just to see if it compiles with schedulerLicenseKey
      let calendar = new Calendar(document.getElementById('cal'), {
        ...getCurrentOptions(),
        schedulerLicenseKey: '<%= versionReleaseDate %>'
      })

      expect(calendar).toBeTruthy()
    })

    it('is invalid when purchased more than a year ago', function() {
      let calendar = initCalendar({
        schedulerLicenseKey: '1234567890-fcs-1273017600' // purchased on 2010-05-05
      })
      expectIsValid(calendar, false)
    })

    it('is valid when purchased less than a year ago', function() {
      let calendar = initCalendar({
        schedulerLicenseKey: '1234567890-fcs-1275868800' // purchased on 2010-06-07
      })
      expectIsValid(calendar, true)
    })

    it('is invalid when not 10 digits in random ID', function() {
      let calendar = initCalendar({
        schedulerLicenseKey: '123456789-fcs-1275868800' // purchased on 2010-06-07
      })
      expectIsValid(calendar, false)
    })

    it('is valid when Creative Commons', function() {
      let calendar = initCalendar({
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives'
      })
      expectIsValid(calendar, true)
    })

    it('is valid when GPL', function() {
      let calendar = initCalendar({
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source'
      })
      expectIsValid(calendar, true)
    })
  }

  function expectIsValid(calendar, bool) {
    let calendarWrapper = new CalendarWrapper(calendar)
    return expect(!calendarWrapper.hasLicenseMessage()).toBe(bool)
  }


  describe('when in a timeline view with resource', function() {
    pushOptions({
      defaultView: 'resourceTimelineDay',
      resources: [ { id: 'a', title: 'Resource A' } ]
    })
    defineTests()
  })

  describe('when in a timeline view no resource', function() {
    pushOptions({
      defaultView: 'timelineDay'
    })
    defineTests()
  })

  describe('when in a month view', function() {
    pushOptions({
      defaultView: 'dayGridMonth'
    })
    defineTests()
  })


  describeOptions('defaultView', {
    'when timeline view': 'resourceTimelineDay',
    'when resource-timegrid view': 'resourceTimeGridDay',
    'when resource-daygrid view': 'resourceDayGridDay'
  }, function() {
    it('only renders one license message when view is rerendered', function() {
      initCalendar({
        schedulerLicenseKey: '1234567890-fcs-1273017600', // purchased on 2010-05-05
        resources: [
          { id: 'a', title: 'Resource A' }
        ]
      })

      let calendarWrapper = new CalendarWrapper(this)
      expect(calendarWrapper.hasLicenseMessage()).toBe(true)
      currentCalendar.next()
      expect(calendarWrapper.hasLicenseMessage()).toBe(true)
    })
  })
})
