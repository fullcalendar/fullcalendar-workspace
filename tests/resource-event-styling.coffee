
describe 'event styling hooks', ->
	pushOptions
		now: '2016-02-14'
		defaultView: 'agendaDay'
		scrollTime: '00:00'
		resources: [
			{ id: 'a', title: 'Resource A', eventColor: 'rgba(255,0,0,0.5)', eventClassName: 're1' }
			{ id: 'b', title: 'Resource B', eventColor: 'rgba(0,255,0,0.5)', eventClassName: 're2' }
		]

	it 'receives colors from resourceId', (done) ->
		initCalendar
			events: [
				{ id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' }
			]
			eventAfterAllRender: ->
				expect($('.event1').css('background-color')).toMatch(/rgba\(255,\s*0,\s*0/) # x-browser
				done()

	# FAILS
	xit 'receives colors from resourceIds', (done) ->
		initCalendar
			events: [
				{ id: '1', title: 'event 1', resourceIds: [ 'a', 'b' ], start: '2016-02-14T01:00:00' }
			]
			eventAfterAllRender: ->
				eventEls = $('.event1')
				expect(eventEls.length).toBe(2)
				expect(eventEls.eq(0).css('background-color')).toMatch(/rgba\(255,\s*0,\s*0/) # x-browser
				expect(eventEls.eq(1).css('background-color')).toMatch(/rgba\(0,\s*255,\s*0/) # x-browser
				done()

	# FAILS
	xit 'receives eventClassName from resourceId', (done) ->
		initCalendar
			events: [
				{ id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' }
			]
			eventAfterAllRender: ->
				expect($('.event1').hasClass('re1')).toBe(true)
				done()

	# FAILS
	xit 'receives eventClassName from resourceId', (done) ->
		initCalendar
			events: [
				{ id: '1', title: 'event 1', className: 'event1', resourceId: [ 'a', 'b' ], start: '2016-02-14T01:00:00' }
			]
			eventAfterAllRender: ->
				expect($('.event1').hasClass('re1')).toBe(true)
				expect($('.event1').hasClass('re2')).toBe(true)
				done()
