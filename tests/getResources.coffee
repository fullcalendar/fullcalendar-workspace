
describe 'getResources', ->
	pushOptions
		resources: [
			{ id: 'a', title: 'a' }
			{ id: 'b', title: 'b' }
			{ id: 'c', title: 'c' }
		]

	it 'does not mutate when removeResource is called', ->
		initCalendar()
		resources = currentCalendar.getResources()
		expect(resources.length).toBe(3)
		currentCalendar.removeResource(resources[0])
		expect(resources.length).toBe(3)
