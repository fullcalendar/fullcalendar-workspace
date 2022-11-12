describe('resource crudding', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
  })

  describe('getResourceById', () => {
    describe('when given a resource with an alphabetical id', () => {
      it('queries correctly', () => {
        initCalendar({
          resources: [
            { id: 'a', title: 'room a' },
          ],
        })
        const resource = currentCalendar.getResourceById('a')
        expect(resource.title).toBe('room a')
      })
    })

    describe('when given a resource with a numeric id', () => {
      it('queries correctly with a number', () => {
        initCalendar({
          resources: [
            { id: '1', title: 'room 1' },
          ],
        })
        const resource = currentCalendar.getResourceById(1 as any)
        expect(resource.title).toBe('room 1')
      })

      it('queries correctly with a string', () => {
        initCalendar({
          resources: [
            { id: '1', title: 'room 1' },
          ],
        })
        const resource = currentCalendar.getResourceById('1')
        expect(resource.title).toBe('room 1')
      })
    })
  })

  describe('getResources', () => {
    it('gets all resources, even nested', () => {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' },
            ] },
        ],
      })
      const resources = currentCalendar.getResources()
      expect(resources.length).toBe(3)
      expect(resources[0].title).toBe('room a')
      expect(resources[1].title).toBe('room b')
      expect(resources[2].title).toBe('room b1')
    })
  })

  describe('getTopLevelResources', () => {
    it('gets only top-level resources', () => {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' },
            ] },
        ],
      })
      const resources = currentCalendar.getTopLevelResources()
      expect(resources.length).toBe(2)
      expect(resources[0].title).toBe('room a')
      expect(resources[1].title).toBe('room b')
    })
  })

  describe('Resource::getChildren', () => {
    it('gets only top-level resources', () => {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' },
            ] },
        ],
      })
      const children = currentCalendar.getResourceById('b').getChildren()
      expect(children.length).toBe(1)
      expect(children[0].title).toBe('room b1')
    })
  })

  describe('addResource', () => {
    it('correctly adds a resouce', () => {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
        ],
      })
      let resources = currentCalendar.getResources()
      expect(resources.length).toBe(1)
      currentCalendar.addResource({ id: 'b', title: 'room b' })
      resources = currentCalendar.getResources()
      expect(resources.length).toBe(2)
      expect(resources[1].title).toBe('room b')
    })
  })

  describe('Resource::remove', () => {
    it('works when given an ID', () => {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' },
        ],
      })
      let resources = currentCalendar.getResources()
      expect(resources.length).toBe(2)
      currentCalendar.getResourceById('a').remove()
      resources = currentCalendar.getResources()
      expect(resources.length).toBe(1)
      expect(resources[0].title).toBe('room b')
    })

    it('works when given a resource object', () => {
      initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' },
        ],
      })
      let resources = currentCalendar.getResources()
      expect(resources.length).toBe(2)
      resources[0].remove()
      resources = currentCalendar.getResources()
      expect(resources.length).toBe(1)
      expect(resources[0].title).toBe('room b')
    })
  })

  describe('refetchResources', () => {
    it('will replace previous resources', () => {
      let callCnt = 0

      initCalendar({
        resources(arg, callback) {
          let res = !callCnt ? [
            { id: 'a', title: 'room a' },
            { id: 'b', title: 'room b' },
          ] : [
            { id: 'c', title: 'room c' },
          ]
          callCnt += 1
          callback(res)
        },
      })

      let resources = currentCalendar.getResources()
      expect(resources.length).toBe(2)
      expect(resources[0].title).toBe('room a')
      currentCalendar.refetchResources()
      resources = currentCalendar.getResources()
      expect(resources.length).toBe(1)
      expect(resources[0].title).toBe('room c')
    })
  })

  describe('Resource::getEvents', () => {
    pushOptions({
      initialView: 'resourceTimelineMonth',
      now: '2015-11-17',
    })

    describe('when given a resourceId', () => {
      it('returns the associated events', () => {
        initCalendar({
          resources: [
            { id: 'a', title: 'room a' },
            { id: 'b', title: 'room b' },
          ],
          events: [
            {
              title: 'event 1',
              className: 'event1',
              start: '2015-11-17',
              end: '2015-11-18',
              resourceId: 'a',
            },
          ],
        })

        const events = currentCalendar.getResourceById('a').getEvents()
        expect(events.length).toBe(1)
      })
    })

    describe('when given a resourceId and event has multiple resources', () => {
      it('returns the associated events', () => {
        initCalendar({
          resources: [
            { id: 'a', title: 'room a' },
            { id: 'b', title: 'room b' },
          ],
          events: [
            {
              title: 'event 1',
              className: 'event1',
              start: '2015-11-17',
              end: '2015-11-18',
              resourceIds: ['a', 'b'],
            },
          ],
        })

        const events = currentCalendar.getResourceById('a').getEvents()
        expect(events.length).toBe(1)
      })
    })
  })
})
