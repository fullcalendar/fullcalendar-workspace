
# TODO: make more DRY (with agenda's config too)

FC.views.basic.queryResourceClass = (viewSpec) ->
	if (viewSpec.options.groupByResource or \
		viewSpec.options.groupByDateAndResource) ? \
		viewSpec.duration.as('days') == 1 # fallback if both undefined
			ResourceBasicView

FC.views.month.queryResourceClass = (viewSpec) ->
	if viewSpec.options.groupByResource or \
		viewSpec.options.groupByDateAndResource
			ResourceMonthView