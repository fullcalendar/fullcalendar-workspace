
describe('resourcesInitiallyExpanded', function() {
  pushOptions({
    defaultView: 'timelineDay',
    defaultDate: '2017-10-10',
    scrollTime: '09:00',
    resources: [
      { id: 'a',
        title: 'Resource A',
        children: [
          { id: 'a1', title: 'Resource A1' },
          { id: 'a2', title: 'Resource A2' }
        ] }
    ]
  })

  describe('when enabled', function() {
    pushOptions({
      resourcesInitiallyExpanded: true
    })

    it('renders resources expanded', function() {
      initCalendar()
      expect(getVisibleResourceIds()).toEqual([ 'a', 'a1', 'a2' ])
    })
  })


  describe('when disabled', function() {
    pushOptions({
      resourcesInitiallyExpanded: false
    })


    it('renders child resources contracted', function() {
      initCalendar()
      expect(getVisibleResourceIds()).toEqual([ 'a' ])
    })


    it('renders background events when expanded', function() {
      initCalendar({
        events: [
          { resourceId: 'a1',
            title: 'event1',
            className: 'event1',
            rendering: 'background',
            start: '2017-10-10T10:00:00' }
        ]
      })

      expect($('.event1.fc-bgevent').length).toBe(0)

      clickExpander()
      expect($('.event1.fc-bgevent').length).toBe(1)
    })


    describe('with foreground events', function() {
      pushOptions({
        events: [
          { resourceId: 'a1',
            title: 'event1',
            className: 'event1',
            start: '2017-10-10T08:00:00',
            end: '2017-10-10T12:00:00' }
        ]
      })


      it('renders when expanded', function() {
        initCalendar()

        expect($('.event1').length).toBe(0)

        clickExpander()
        expect($('.event1').length).toBe(1)
      })


      it('renders scrollfollowers when expanded', function() {
        initCalendar()

        expect($('.fc-title.fc-following').length).toBe(0)

        clickExpander()
        expect($('.fc-title.fc-following').length).toBe(1)
      })
    })


    describe('with row grouping', function() {
      pushOptions({
        resourceGroupField: 'customField',
        resources: [
          { title: 'a', id: 'a', customField: 1 }
        ]
      })

      it('initializes with groups contracted', function() {
        initCalendar()
        expect(getVisibleResourceIds().length).toBe(0)
        expect(getHGroupCnt()).toBe(1)
      })
    })


    /*
    NOTE: business hours tests are in timeline-businessHours
    */
  })


  function getVisibleResourceIds() {
    return $('.fc-body .fc-resource-area tr[data-resource-id]:visible').map(function(i, node) {
      return $(node).data('resource-id')
    }).get()
  }

  function getHGroupCnt() {
    return $('.fc-body .fc-resource-area .fc-divider').length
  }

  function clickExpander() {
    return $('.fc-expander').simulate('click')
  }
})
