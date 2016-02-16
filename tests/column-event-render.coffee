
describe 'vresource event rendering', ->
	pushOptions
		now: '2015-11-17'
		scrollTime: '00:00'
		views:
			agendaTwoDay:
				type: 'agenda'
				duration: { days: 2 }
			basicTwoDay:
				type: 'basic'
				duration: { days: 2 }
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
			{ id: 'c', title: 'Resource C' }
		]

	describeOptions 'isRTL', {
		'when LTR': false
		'when RTL': true
	}, (isRTL) ->

		describeValues {
			'with normal event': null
			'with background events': 'background'
		}, (renderingType) ->

			describe 'with a single-day event', ->

				describeOptions {
					'when agendaTwoDay':
						defaultView: 'agendaTwoDay'
						events: [
							{
								title: 'event 1'
								className: 'event1'
								start: '2015-11-17T12:00:00'
								end: '2015-11-17T02:00:00'
								resourceId: 'c'
								rendering: renderingType
							}
						]
					'when basicTwoDay':
						defaultView: 'basicTwoDay'
						events: [
							{
								title: 'event 1'
								className: 'event1'
								start: '2015-11-17'
								end: '2015-11-18'
								resourceId: 'c'
								rendering: renderingType
							}
						]
				}, ->

					describe 'when resources above dates', ->
						pushOptions
							groupByResource: true

						it 'renders in the correct column', (callback) ->
							initCalendar
								eventAfterAllRender: ->
									colRect = getTrailingBoundingRect(getHeadDowEls('tue'), isRTL)
									eventRect = getBoundingRect('.event1')
									expect(eventRect).toBeMostlyHBoundedBy(colRect)
									callback()

					describe 'when dates above resources', ->
						pushOptions
							groupByDateAndResource: true

						it 'renders in the correct column', (callback) ->
							initCalendar
								eventAfterAllRender: ->
									resourceRect = getLeadingBoundingRect(getHeadResourceEls('c'), isRTL)
									eventRect = getBoundingRect('.event1')
									expect(eventRect).toBeMostlyHBoundedBy(resourceRect)
									callback()

			describe 'when a multi-day event', ->

				describe 'when agendaTwoDay', ->
					pushOptions
						defaultView: 'agendaTwoDay'
						events: [
							{
								title: 'event 1'
								className: 'event1'
								start: '2015-11-17T12:00:00'
								end: '2015-11-18T12:00:00'
								resourceId: 'c'
								rendering: renderingType
							}
						]

					describe 'when resources above dates', ->
						pushOptions
							groupByResource: true

						it 'renders in the correct columns', (callback) ->
							initCalendar
								eventAfterAllRender: ->
									eventEls = $('.event1')
									expect(eventEls.length).toBe(2)
									firstEventRect = getLeadingBoundingRect(eventEls, isRTL)
									lastEventRect = getTrailingBoundingRect(eventEls, isRTL)
									if not renderingType # non-background events
										expect(firstEventRect.node).toHaveClass('fc-start')
										expect(lastEventRect.node).toHaveClass('fc-end')
									tueRect = getTrailingBoundingRect(getHeadDowEls('tue'), isRTL)
									wedRect = getTrailingBoundingRect(getHeadDowEls('wed'), isRTL)
									expect(firstEventRect).toBeMostlyHBoundedBy(tueRect)
									expect(lastEventRect).toBeMostlyHBoundedBy(wedRect)
									callback()

					describe 'when dates above resources', ->
						pushOptions
							groupByDateAndResource: true

						it 'renders in the correct columns', (callback) ->
							initCalendar
								eventAfterAllRender: ->
									eventEls = $('.event1')
									expect(eventEls.length).toBe(2)
									firstEventRect = getLeadingBoundingRect(eventEls, isRTL)
									lastEventRect = getTrailingBoundingRect(eventEls, isRTL)
									if not renderingType # non-background events
										expect(firstEventRect.node).toHaveClass('fc-start')
										expect(lastEventRect.node).toHaveClass('fc-end')
									resourceEls = getHeadResourceEls('c')
									firstResourceRect = getLeadingBoundingRect(resourceEls, isRTL)
									lastResourceRect = getTrailingBoundingRect(resourceEls, isRTL)
									expect(firstEventRect).toBeMostlyHBoundedBy(firstResourceRect)
									expect(lastEventRect).toBeMostlyHBoundedBy(lastResourceRect)
									callback()

				describe 'when basicTwoDay', ->
					pushOptions
						defaultView: 'basicTwoDay'
						events: [
							{
								title: 'event 1'
								className: 'event1'
								start: '2015-11-17'
								end: '2015-11-19'
								resourceId: 'c'
								rendering: renderingType
							}
						]

					describe 'when resources above dates', ->
						pushOptions
							groupByResource: true

						it 'renders in the correct columns', (callback) ->
							initCalendar
								eventAfterAllRender: ->
									eventRect = getBoundingRect('.event1')
									tueRect = getTrailingBoundingRect(getHeadDowEls('tue'), isRTL)
									wedRect = getTrailingBoundingRect(getHeadDowEls('wed'), isRTL)
									expect(tueRect).toBeMostlyHBoundedBy(eventRect)
									expect(wedRect).toBeMostlyHBoundedBy(eventRect)
									callback()

					describe 'when dates above resources', ->
						pushOptions
							groupByDateAndResource: true

						it 'renders in the correct columns', (callback) ->
							initCalendar
								eventAfterAllRender: ->
									eventEls = $('.event1')
									expect(eventEls.length).toBe(2)
									firstEventRect = getLeadingBoundingRect(eventEls, isRTL)
									lastEventRect = getTrailingBoundingRect(eventEls, isRTL)
									if not renderingType # non-background events
										expect(firstEventRect.node).toHaveClass('fc-start')
										expect(lastEventRect.node).toHaveClass('fc-end')
									resourceEls = getHeadResourceEls('c')
									firstResourceRect = getLeadingBoundingRect(resourceEls, isRTL)
									lastResourceRect = getTrailingBoundingRect(resourceEls, isRTL)
									expect(firstEventRect).toBeMostlyHBoundedBy(firstResourceRect)
									expect(lastEventRect).toBeMostlyHBoundedBy(lastResourceRect)
									callback()

			describe 'with an event with no resources', ->

				describeOptions {
					'when agendaTwoDay':
						defaultView: 'agendaTwoDay'
						events: [
							{
								title: 'event 1'
								className: 'event1'
								start: '2015-11-17T12:00:00'
								end: '2015-11-17T02:00:00'
								rendering: renderingType
							}
						]
					'when basicTwoDay':
						defaultView: 'basicTwoDay'
						events: [
							{
								title: 'event 1'
								className: 'event1'
								start: '2015-11-17'
								end: '2015-11-18'
								rendering: renderingType
							}
						]
				}, ->

					describeOptions {
						'when resources above dates':
							groupByResource: true
						'when dates above resources':
							groupByDateAndResource: true
					}, ->

						if renderingType == 'background'

							it 'renders on every resource', (callback) ->
								initCalendar
									eventAfterAllRender: ->
										eventEls = $('.event1')
										expect(eventEls.length).toBe(3)
										callback()
						else

							it 'doesn\'t render at all', (callback) ->
								initCalendar
									eventAfterAllRender: ->
										eventEls = $('.event1')
										expect(eventEls.length).toBe(0)
										callback()

	describe 'with an event with multiple', ->
		pushOptions
			events: [{
				title: 'event 1'
				className: 'event1'
				start: '2015-11-17T01:00:00'
				end: '2015-11-17T05:00:00'
				resourceIds: [ 'a', 'b' ]
			}]

		it 'renders each event in a separate resource column', (done) ->
			initCalendar
				defaultView: 'agendaDay'
				eventAfterAllRender: ->
					expect($('.event1').length).toBe(2)
					done()

		it 'renders a single event when no resource columns', (done) ->
			initCalendar
				defaultView: 'agendaTwoDay'
				eventAfterAllRender: ->
					expect($('.event1').length).toBe(1)
					done()
