
describe 'resourcesInitiallyExpanded', ->
	pushOptions
		defaultView: 'timelineDay'
		defaultDate: '2017-10-10'
		scrollTime: '09:00'
		resources: [
			{ id: 'a', title: 'Resource A', children: [
				{ id: 'a1', title: 'Resource A1' }
				{ id: 'a2', title: 'Resource A2' }
			] }
		]

	describe 'when enabled', ->
		pushOptions
			resourcesInitiallyExpanded: true


		it 'renders resources expanded', ->
			initCalendar()
			expect(getVisibleResourceIds()).toEqual([ 'a', 'a1', 'a2' ])


	describe 'when enabled', ->
		pushOptions
			resourcesInitiallyExpanded: false


		it 'renders child resources contracted', ->
			initCalendar()
			expect(getVisibleResourceIds()).toEqual([ 'a' ])


		it 'renders background events when expanded', ->
			initCalendar
				events: [
					{ resourceId: 'a1', title: 'event1', className: 'event1', rendering: 'background', \
						start: '2017-10-10T10:00:00' }
				]

			expect($('.event1.fc-bgevent').length).toBe(0)

			clickExpander()
			expect($('.event1.fc-bgevent').length).toBe(1)


		describe 'with foreground events', ->
			pushOptions
				events: [
					{ resourceId: 'a1', title: 'event1', className: 'event1', \
						start: '2017-10-10T08:00:00', end: '2017-10-10T12:00:00' }
				]


			it 'renders when expanded', ->
				initCalendar()

				expect($('.event1').length).toBe(0)

				clickExpander()
				expect($('.event1').length).toBe(1)


			it 'renders scrollfollowers when expanded', ->
				initCalendar()

				expect($('.fc-title.fc-following').length).toBe(0)

				clickExpander()
				expect($('.fc-title.fc-following').length).toBe(1)


		###
		NOTE: business hours tests are in timeline-businessHours
		###


	getVisibleResourceIds = ->
		$('.fc-body .fc-resource-area tr[data-resource-id]:visible').map (i, node) ->
			$(node).data('resource-id')
		.get()


	clickExpander = ->
		$('.fc-expander').simulate('click')
