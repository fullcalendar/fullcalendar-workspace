import { EventRenderer } from 'fullcalendar'

declare module 'fullcalendar/EventRenderer' {
  interface Default {
    designatedResource: any
    currentResource: any
  }
}

// references to pre-monkeypatched methods
const origMethods = {
  getFallbackStylingObjs: EventRenderer.prototype.getFallbackStylingObjs
}


EventRenderer.prototype.designatedResource = null // optionally set by caller. forces @currentResource
EventRenderer.prototype.currentResource = null // when set, will affect future rendered segs


EventRenderer.prototype.beforeFgSegHtml = function(seg) { // hack
  const segResourceId = seg.footprint.componentFootprint.resourceId

  if (this.designatedResource) {
    this.currentResource = this.designatedResource
  } else if (segResourceId) {
    this.currentResource = queryResourceObject(this, segResourceId)
  } else {
    this.currentResource = null
  }
}


EventRenderer.prototype.getFallbackStylingObjs = function(eventDef) {
  let objs = origMethods.getFallbackStylingObjs.apply(this, arguments)

  if (this.currentResource) {
    objs.unshift(this.currentResource)

  } else {
    const resources = []

    for (let id of eventDef.getResourceIds()) {
      const resource = queryResourceObject(this, id)
      if (resource) {
        resources.push(resource)
      }
    }

    objs = resources.concat(objs)
  }

  return objs
}


function queryResourceObject(eventRenderer, id) {
  return eventRenderer.view.calendar.resourceManager.getResourceById(id)
}
