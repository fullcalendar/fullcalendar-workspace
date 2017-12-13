import { ExternalDropping } from 'fullcalendar'

// references to pre-monkeypatched methods
const origMethods = {
  computeExternalDrop: ExternalDropping.prototype.computeExternalDrop
}


ExternalDropping.prototype.computeExternalDrop = function(componentFootprint, meta) {
  const eventDef = origMethods.computeExternalDrop.apply(this, arguments)

  if (componentFootprint.resourceId) {
    eventDef.addResourceId(componentFootprint.resourceId)
  }

  return eventDef
}
