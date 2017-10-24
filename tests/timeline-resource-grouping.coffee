
describe 'timeline resource grouping', ->
	pushOptions
		defaultView: 'timeline',
		resourceGroupField: 'groupId',
		resources: [
			{
				id: 'A',
				groupId: '1',
				title: 'Resource A'
			},
			{
				id: 'B',
				groupId: '1',
				title: 'Resource B'
			},
			{
				id: 'C',
				groupId: '2',
				title: 'Resource C'
			}
		]


	getRows = -> # TODO: consolidate with getVisibleResourceIds
		$('.fc-body .fc-resource-area tr').map (i, node) ->
			$tr = $(node)
			resourceId = $tr.data('resource-id')
			text = $tr.find('.fc-cell-text').text()

			if resourceId
				{
					type: 'resource',
					resourceId: resourceId,
					text: text
				}
			else if $tr.find('.fc-divider').length
				{
					type: 'divider'
					text: text
				}
			else
				{}
		.get()


	it 'renders the hierarchy correctly', ->
		initCalendar()
		rows = getRows()
		expect(rows.length).toBe(5)
		expect(rows[0].type).toBe('divider')
		expect(rows[0].text).toBe('1')
		expect(rows[1].resourceId).toBe('A')
		expect(rows[2].resourceId).toBe('B')
		expect(rows[3].type).toBe('divider')
		expect(rows[3].text).toBe('2')
		expect(rows[4].resourceId).toBe('C')


	it 'renders base off resourceGroupText function', ->
		initCalendar
			resourceGroupText: (groupId) ->
				'Group ' + groupId

		rows = getRows()
		expect(rows.length).toBe(5)
		expect(rows[0].type).toBe('divider')
		expect(rows[0].text).toBe('Group 1')
		expect(rows[3].type).toBe('divider')
		expect(rows[3].text).toBe('Group 2')
