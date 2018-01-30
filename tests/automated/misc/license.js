
describe('schedulerLicenseKey', function() {

  beforeEach(function() {
    $.fullCalendar.mockSchedulerReleaseDate = '2011-06-06'
  })

  afterEach(function() {
    delete $.fullCalendar.mockSchedulerReleaseDate
  })

  // FYI: eventAfterAllRender guarantees that view's skeleton has been rendered and sized

  function defineTests() {

    it('is invalid when crap text', function(done) {
      initCalendar({
        schedulerLicenseKey: '<%= versionReleaseDate %>',
        eventAfterAllRender() {
          expectIsValid(false)
          done()
        }
      })
    })

    it('is invalid when purchased more than a year ago', function(done) {
      initCalendar({
        schedulerLicenseKey: '1234567890-fcs-1273017600', // purchased on 2010-05-05
        eventAfterAllRender() {
          expectIsValid(false)
          done()
        }
      })
    })

    it('is valid when purchased less than a year ago', function(done) {
      initCalendar({
        schedulerLicenseKey: '1234567890-fcs-1275868800', // purchased on 2010-06-07
        eventAfterAllRender() {
          expectIsValid(true)
          done()
        }
      })
    })

    it('is invalid when not 10 digits in random ID', function(done) {
      initCalendar({
        schedulerLicenseKey: '123456789-fcs-1275868800', // purchased on 2010-06-07
        eventAfterAllRender() {
          expectIsValid(false)
          done()
        }
      })
    })

    it('is valid when Creative Commons', function(done) {
      initCalendar({
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        eventAfterAllRender() {
          expectIsValid(true)
          done()
        }
      })
    })

    it('is valid when GPL', function(done) {
      initCalendar({
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        eventAfterAllRender() {
          expectIsValid(true)
          done()
        }
      })
    })
  };

  function expectIsValid(bool) {
    expect(!$('.fc-license-message').is(':visible')).toBe(bool)
  }


  describe('when in a timeline view with resource', function() {
    pushOptions({
      defaultView: 'timeline',
      resources: [ { id: 'a', title: 'Resource A' } ]
    })
    defineTests()
  })

  describe('when in a timeline view no resource', function() {
    pushOptions({
      defaultView: 'timeline',
      resource: false
    })
    defineTests()
  })

  describe('when in a month view', function() {
    pushOptions({
      defaultView: 'month'
    })
    defineTests()
  })


  describeOptions('defaultView', {
    'when timeline view': 'timelineDay',
    'when resource-agenda view': 'agendaDay',
    'when resource-basic view': 'basicDay'
  }, function() {
    it('only renders one license message when view is rerendered', function(done) {
      let callCnt = 0
      initCalendar({
        schedulerLicenseKey: '1234567890-fcs-1273017600', // purchased on 2010-05-05
        resources: [
          { id: 'a', title: 'Resource A' }
        ],
        viewRender() {
          expect($('.fc-license-message').length).toBe(1)
          callCnt++
          if (callCnt === 1) {
            currentCalendar.next()
          } else if (callCnt === 2) {
            done()
          }
        }
      })
    })
  })
})
