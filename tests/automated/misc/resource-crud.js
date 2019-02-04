
describe('resource crudding', function() {

  pushOptions({
    defaultView: 'resourceTimelineDay'
  })

  describe('getResourceById', function() {

    describe('when given a resource with an alphabetical id', function() {

      it('queries correctly', function(done) {
        initCalendar({
          resources: [
            { id: 'a', title: 'room a' }
          ],
          datesRender() {
            const resource = currentCalendar.getResourceById('a')
            expect(resource.title).toBe('room a')
            done()
          }
        })
      })
    })

    describe('when given a resource with a numeric id', function() {

      it('queries correctly with a number', function(done) {
        initCalendar({
          resources: [
            { id: 1, title: 'room 1' }
          ],
          datesRender() {
            const resource = currentCalendar.getResourceById(1)
            expect(resource.title).toBe('room 1')
            done()
          }
        })
      })

      it('queries correctly with a string', function(done) {
        initCalendar({
          resources: [
            { id: 1, title: 'room 1' }
          ],
          datesRender() {
            const resource = currentCalendar.getResourceById('1')
            expect(resource.title).toBe('room 1')
            done()
          }
        })
      })
    })
  })

  describe('getResources', function() {

    it('gets all resources, even nested', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' }
            ] }
        ],
        datesRender() {
          const resources = currentCalendar.getResources()
          expect(resources.length).toBe(3)
          expect(resources[0].title).toBe('room a')
          expect(resources[1].title).toBe('room b')
          expect(resources[2].title).toBe('room b1')
          done()
        }
      })
    })
  })

  describe('getTopLevelResources', function() {

    it('gets only top-level resources', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' }
            ] }
        ],
        datesRender() {
          const resources = currentCalendar.getTopLevelResources()
          expect(resources.length).toBe(2)
          expect(resources[0].title).toBe('room a')
          expect(resources[1].title).toBe('room b')
          done()
        }
      })
    })
  })

  describe('Resource::getChildren', function() {

    it('gets only top-level resources', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' }
            ] }
        ],
        datesRender() {
          const children = currentCalendar.getResourceById('b').getChildren()
          expect(children.length).toBe(1)
          expect(children[0].title).toBe('room b1')
          done()
        }
      })
    })
  })

  describe('addResource', function() {

    it('correctly adds a resouce', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' }
        ],
        datesRender() {
          let resources = currentCalendar.getResources()
          expect(resources.length).toBe(1)
          currentCalendar.addResource({ id: 'b', title: 'room b' })
          resources = currentCalendar.getResources()
          expect(resources.length).toBe(2)
          expect(resources[1].title).toBe('room b')
          done()
        }
      })
    })
  })

  describe('Resource::remove', function() {

    it('works when given an ID', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' }
        ],
        datesRender() {
          let resources = currentCalendar.getResources()
          expect(resources.length).toBe(2)
          currentCalendar.getResourceById('a').remove()
          resources = currentCalendar.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].title).toBe('room b')
          done()
        }
      })
    })

    it('works when given a resource object', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' }
        ],
        datesRender() {
          let resources = currentCalendar.getResources()
          expect(resources.length).toBe(2)
          resources[0].remove()
          resources = currentCalendar.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].title).toBe('room b')
          done()
        }
      })
    })
  })

  describe('refetchResources', function() {

    it('will replace previous resources', function(done) {
      let callCnt = 0

      initCalendar({
        resources(arg, callback) {
          let res = !callCnt ? [
            { id: 'a', title: 'room a' },
            { id: 'b', title: 'room b' }
          ] : [
            { id: 'c', title: 'room c' }
          ]
          callCnt += 1
          callback(res)
        },
        datesRender() {
          let resources = currentCalendar.getResources()
          expect(resources.length).toBe(2)
          expect(resources[0].title).toBe('room a')
          currentCalendar.refetchResources()
          resources = currentCalendar.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].title).toBe('room c')
          done()
        }
      })
    })
  })


  describe('Resource::getEvents', function() {
    pushOptions({
      defaultView: 'resourceTimelineMonth',
      now: '2015-11-17'
    })

    describe('when given a resourceId', function() {

      it('returns the associated events', function(done) {
        initCalendar({
          resources: [
            { id: 'a', title: 'room a' },
            { id: 'b', title: 'room b' }
          ],
          events: [
            {
              title: 'event 1',
              className: 'event1',
              start: '2015-11-17',
              end: '2015-11-18',
              resourceId: 'a'
            }
          ],
          _eventsPositioned() {
            const events = currentCalendar.getResourceById('a').getEvents()
            expect(events.length).toBe(1)
            done()
          }
        })
      })
    })

    describe('when given a resourceId and event has multiple resources', function() {

      it('returns the associated events', function(done) {
        initCalendar({
          resources: [
            { id: 'a', title: 'room a' },
            { id: 'b', title: 'room b' }
          ],
          events: [
            {
              title: 'event 1',
              className: 'event1',
              start: '2015-11-17',
              end: '2015-11-18',
              resourceIds: ['a', 'b']
            }
          ],
          _eventsPositioned() {
            const events = currentCalendar.getResourceById('a').getEvents()
            expect(events.length).toBe(1)
            done()
          }
        })
      })
    })
  })
})
