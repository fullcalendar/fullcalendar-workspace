import { DateSelecting } from 'fullcalendar'
import ResourceComponentFootprint from '../../models/ResourceComponentFootprint'

// references to pre-monkeypatched methods
const origMethods = {
  computeSelectionFootprint: DateSelecting.prototype.computeSelectionFootprint
}


DateSelecting.prototype.computeSelectionFootprint = function(startFootprint, endFootprint) {

  if (
    startFootprint.resourceId && endFootprint.resourceId &&
    (startFootprint.resourceId !== endFootprint.resourceId) &&
    !this.component.allowCrossResource
  ) {
    return null // explicity disallow selection across two different resources
  } else {
    let footprint = origMethods.computeSelectionFootprint.apply(this, arguments)

    if (startFootprint.resourceId) {
      // create a new footprint with resourceId data
      footprint = new ResourceComponentFootprint(
        footprint.unzonedRange,
        footprint.isAllDay,
        startFootprint.resourceId
      )
    }

    return footprint
  }
}
