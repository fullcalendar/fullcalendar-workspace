describe('resource crudding', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
  })

  describe('getResourceById', () => {
    describe('when given a resource with an alphabetical id', () => {
      it('queries correctly', () => {
        let calendar = initCalendar({
          resources: [
            { id: 'a', title: 'room a' },
          ],
        })
        const resource = calendar.getResourceById('a')
        expect(resource.title).toBe('room a')
      })
    })

    describe('when given a resource with a numeric id', () => {
      it('queries correctly with a number', () => {
        let calendar = initCalendar({
          resources: [
            { id: '1', title: 'room 1' },
          ],
        })
        const resource = calendar.getResourceById(1 as any)
        expect(resource.title).toBe('room 1')
      })

      it('queries correctly with a string', () => {
        let calendar = initCalendar({
          resources: [
            { id: '1', title: 'room 1' },
          ],
        })
        const resource = calendar.getResourceById('1')
        expect(resource.title).toBe('room 1')
      })
    })
  })

  describe('getResources', () => {
    it('gets all resources, even nested', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' },
            ] },
        ],
      })
      const resources = calendar.getResources()
      expect(resources.length).toBe(3)
      expect(resources[0].title).toBe('room a')
      expect(resources[1].title).toBe('room b')
      expect(resources[2].title).toBe('room b1')
    })
  })

  describe('getTopLevelResources', () => {
    it('gets only top-level resources', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' },
            ] },
        ],
      })
      const resources = calendar.getTopLevelResources()
      expect(resources.length).toBe(2)
      expect(resources[0].title).toBe('room a')
      expect(resources[1].title).toBe('room b')
    })
  })

  describe('Resource::getChildren', () => {
    it('gets only top-level resources', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' },
            ] },
        ],
      })
      const children = calendar.getResourceById('b').getChildren()
      expect(children.length).toBe(1)
      expect(children[0].title).toBe('room b1')
    })
  })

  describe('Resource::getParent', () => {
    it('gets only top-level resources', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b',
            title: 'room b',
            children: [
              { id: 'b1', title: 'room b1' },
            ] },
        ],
      })
      const child = calendar.getResourceById('b1')
      expect(child.title).toBe('room b1')
      const parent = child.getParent()
      expect(parent.title).toBe('room b')
    })
  })

  describe('addResource', () => {
    it('correctly adds a resouce', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
        ],
      })
      let resources = calendar.getResources()
      expect(resources.length).toBe(1)
      calendar.addResource({ id: 'b', title: 'room b' })
      resources = calendar.getResources()
      expect(resources.length).toBe(2)
      expect(resources[1].title).toBe('room b')
    })
  })

  describe('Resource::remove', () => {
    it('works when given an ID', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' },
        ],
      })
      let resources = calendar.getResources()
      expect(resources.length).toBe(2)
      calendar.getResourceById('a').remove()
      resources = calendar.getResources()
      expect(resources.length).toBe(1)
      expect(resources[0].title).toBe('room b')
    })

    it('works when given a resource object', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' },
        ],
      })
      let resources = calendar.getResources()
      expect(resources.length).toBe(2)
      resources[0].remove()
      resources = calendar.getResources()
      expect(resources.length).toBe(1)
      expect(resources[0].title).toBe('room b')
    })
  })

  describe('refetchResources', () => {
    it('will replace previous resources', () => {
      let callCnt = 0

      let calendar = initCalendar({
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

      let resources = calendar.getResources()
      expect(resources.length).toBe(2)
      expect(resources[0].title).toBe('room a')
      calendar.refetchResources()
      resources = calendar.getResources()
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
        let calendar = initCalendar({
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

        const events = calendar.getResourceById('a').getEvents()
        expect(events.length).toBe(1)
      })
    })

    describe('when given a resourceId and event has multiple resources', () => {
      it('returns the associated events', () => {
        let calendar = initCalendar({
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

        const events = calendar.getResourceById('a').getEvents()
        expect(events.length).toBe(1)
      })
    })
  })
})
