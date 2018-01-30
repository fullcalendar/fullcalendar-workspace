/*
getResourceById
getResources
addResource
removeResource
refetchResources
getResourceEvents
*/

describe('resource crudding', function() {

  pushOptions({
    defaultView: 'timelineDay'
  })

  describe('getResourceById', function() {

    describe('when given a resource with an alphabetical id', function() {

      it('queries correctly', function(done) {
        initCalendar({
          resources: [
            { id: 'a', title: 'room a' }
          ],
          viewRender() {
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
          viewRender() {
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
          viewRender() {
            const resource = currentCalendar.getResourceById('1')
            expect(resource.title).toBe('room 1')
            done()
          }
        })
      })
    })
  })

  describe('getResources', function() {

    it('gets flat top-level resources', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' }
        ],
        viewRender() {
          const resources = currentCalendar.getResources()
          expect(resources.length).toBe(2)
          expect(resources[0].title).toBe('room a')
          expect(resources[1].title).toBe('room b')
          done()
        }
      })
    })

    it('gets nested top-level resources', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' }
            ] }
        ],
        viewRender() {
          const resources = currentCalendar.getResources()
          expect(resources.length).toBe(2)
          expect(resources[0].title).toBe('room a')
          expect(resources[1].title).toBe('room b')
          expect(resources[1].children[0].title).toBe('room b1')
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
        viewRender() {
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

  describe('removeResource', function() {

    it('works when given an ID', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' }
        ],
        viewRender() {
          let resources = currentCalendar.getResources()
          expect(resources.length).toBe(2)
          currentCalendar.removeResource('a')
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
        viewRender() {
          let resources = currentCalendar.getResources()
          expect(resources.length).toBe(2)
          currentCalendar.removeResource(resources[0])
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
        resources(callback) {
          const res =
            !callCnt
              ? [
                { id: 'a', title: 'room a' },
                { id: 'b', title: 'room b' }
              ]
              : [
                { id: 'c', title: 'room c' }
              ]
          callCnt += 1
          callback(res)
        },
        viewRender() {
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


  describe('getResourceEvents', function() {
    pushOptions({
      defaultView: 'timelineMonth',
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
          eventAfterAllRender() {
            const events = currentCalendar.getResourceEvents('a')
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
          eventAfterAllRender() {
            const events = currentCalendar.getResourceEvents('a')
            expect(events.length).toBe(1)
            done()
          }
        })
      })
    })
  })
})
