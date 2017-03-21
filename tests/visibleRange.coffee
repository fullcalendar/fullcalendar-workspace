
describe 'visibleRange', ->
	pushOptions
		resources: [
			{ id: 'a', title: 'a' }
			{ id: 'b', title: 'b' }
			{ id: 'c', title: 'c' }
		]


	describe 'in timeline view for a few days', ->
		pushOptions
			defaultView: 'timeline'

		it 'renders the range correctly', ->
			initCalendar
				visibleRange:
					start: '2017-06-07'
					end: '2017-06-09'

			dates = $('.fc-head .fc-time-area tr:first-child > th[data-date]').map (i, node) ->
				$.fullCalendar.moment.parseZone($(node).data('date'))
			.get()

			expect(dates.length).toBe(2)
			expect(dates[0]).toEqualMoment('2017-06-07T00:00:00')
			expect(dates[1]).toEqualMoment('2017-06-08T00:00:00')


	describe 'in timeline view for years', ->
		pushOptions
			defaultView: 'timeline'

		it 'renders the range correctly', ->
			initCalendar
				visibleRange:
					start: '2017-01'
					end: '2019-01'

			dates = $('.fc-head .fc-time-area tr:first-child > th[data-date]').map (i, node) ->
				$.fullCalendar.moment.parseZone($(node).data('date'))
			.get()

			expect(dates.length).toBe(2)
			expect(dates[0]).toEqualMoment('2017-01-01')
			expect(dates[1]).toEqualMoment('2018-01-01')


	describe 'in vertical resource view', ->
		pushOptions
			defaultView: 'agenda'
			groupByDateAndResource: true

		it 'renders range correctly', ->
			initCalendar
				visibleRange:
					start: '2017-06-07'
					end: '2017-06-09'

			dates = $('.fc-head tr:first-child > th[data-date]').map (i, node) ->
				$.fullCalendar.moment.parseZone($(node).data('date'))
			.get()

			expect(dates.length).toBe(2)
			expect(dates[0]).toEqualMoment('2017-06-07')
			expect(dates[1]).toEqualMoment('2017-06-08')
