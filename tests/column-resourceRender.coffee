
describe 'column-view resourceRender trigger', ->
	pushOptions
		now: '2016-02-13'
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]
		views:
			agendaThreeDay:
				type: 'agenda'
				duration: { days: 3 }
			basicThreeDay:
				type: 'basic'
				duration: { days: 3 }

	describeOptions 'isRTL', {
		'when LTR': false
		'when RTL': true
	}, ->

		describe 'when resource above dates', ->
			pushOptions
				groupByResource: true

			describeOptions 'defaultView', {
				'when agenda view': 'agendaThreeDay'
				'when basic view': 'basicThreeDay'
				'when month view': 'month'
			}, ->

				it 'fires once per resources', (done) ->
					callCnt = 0
					initCalendar
						resourceRender: (resource, headTds) ->
							if resource.id == 'a'
								expect(headTds.length).toBe(1)
								expect(headTds).toContainText('Resource A')
								callCnt++
						viewRender: ->
							expect(callCnt).toBe(1)
							done()

		describe 'when dates above resource', ->
			pushOptions
				groupByDateAndResource: true

			describeOptions 'defaultView', {
				'when agenda view': 'agendaThreeDay'
				'when basic view': 'basicThreeDay'
			}, ->

				it 'fires onces per day', (done) ->
					callCnt = 0
					initCalendar
						resourceRender: (resource, headTds) ->
							if resource.id == 'a'
								expect(headTds.length).toBe(1)
								expect(headTds).toContainText('Resource A')
								callCnt++
						viewRender: ->
							expect(callCnt).toBe(3)
							done()

			describe 'when month view', ->
				pushOptions
					defaultView: 'month'

				it 'fires onces per day', (done) ->
					callCnt = 0
					initCalendar
						resourceRender: (resource, headTds) ->
							if resource.id == 'a'
								expect(headTds.length).toBe(1)
								expect(headTds).toContainText('Resource A')
								callCnt++
						viewRender: ->
							expect(callCnt).toBe(7) # 7 days of the week
							done()
