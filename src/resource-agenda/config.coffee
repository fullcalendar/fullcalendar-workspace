
# TODO: make more DRY, with basic's config

FC.views.agenda.queryResourceClass = (viewSpec) ->
	if (viewSpec.options.groupByResource or \
		viewSpec.options.groupByDateAndResource) ? \
		viewSpec.duration.as('days') == 1 # fallback if both undefined
			ResourceAgendaView