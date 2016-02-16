
describe 'event styling hooks', ->
	pushOptions
		now: '2016-02-14'
		defaultView: 'agendaDay'
		scrollTime: '00:00'
		resources: [
			{ id: 'a', title: 'Resource A', eventColor: 'rgba(255,0,0,0.5)', eventClassName: 're1' }
			{ id: 'b', title: 'Resource B', eventColor: 'rgba(0,255,0,0.5)', eventClassName: [ 're2', 're3' ] }
		]

	it 'receives colors from resourceId', (done) ->
		initCalendar
			events: [
				{ id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' }
			]
			eventAfterAllRender: ->
				expect($('.event1').css('background-color')).toMatch(/rgba\(255,\s*0,\s*0/) # x-browser
				done()

	it 'receives colors from resourceIds', (done) ->
		initCalendar
			events: [
				{ id: '1', title: 'event 1', className: 'event1', resourceIds: [ 'a', 'b' ], start: '2016-02-14T01:00:00' }
			]
			eventAfterAllRender: ->
				els = $('.event1')
				expect(els.length).toBe(2)
				expect(els.eq(0).css('background-color')).toMatch(/rgba\(255,\s*0,\s*0/) # x-browser
				expect(els.eq(1).css('background-color')).toMatch(/rgba\(0,\s*255,\s*0/) # x-browser
				done()

	it 'receives eventClassName from resourceId', (done) ->
		initCalendar
			events: [
				{ id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' }
			]
			eventAfterAllRender: ->
				el = $('.event1')
				expect(el.length).toBe(1)
				expect(el).toHaveClass('re1')
				expect(el).not.toHaveClass('re2')
				expect(el).not.toHaveClass('re3')
				done()

	it 'receives eventClassName from resourceIds', (done) ->
		initCalendar
			events: [
				{ id: '1', title: 'event 1', className: 'event1', resourceIds: [ 'a', 'b' ], start: '2016-02-14T01:00:00' }
			]
			eventAfterAllRender: ->
				els = $('.event1')
				expect(els.length).toBe(2)
				expect(els.eq(0)).toHaveClass('re1')
				expect(els.eq(0)).not.toHaveClass('re2')
				expect(els.eq(0)).not.toHaveClass('re3')
				expect(els.eq(1)).not.toHaveClass('re1')
				expect(els.eq(1)).toHaveClass('re2')
				expect(els.eq(1)).toHaveClass('re3')
				done()
