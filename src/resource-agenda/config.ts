import { getViewConfig } from 'fullcalendar'
import ResourceAgendaView from './ResourceAgendaView'

/*
TODO: make more DRY, with basic's config
*/
getViewConfig('agenda').queryResourceClass = function(viewSpec) {
  const explicitGrouping =
    viewSpec.options.groupByResource ||
    viewSpec.options.groupByDateAndResource
  let showsResources = false

  if (explicitGrouping != null) {
    showsResources = explicitGrouping
  } else if (viewSpec.duration) {
    showsResources = viewSpec.duration.as('days') === 1
  }

  if (showsResources) {
    return ResourceAgendaView
  }
}
