import { InteractiveDateComponent } from 'fullcalendar'

declare module 'fullcalendar/InteractiveDateComponent' {
  interface Default {
    allowCrossResource: boolean
    isEventDefResourceEditable(eventDef): boolean
  }
}

// references to pre-monkeypatched methods
const origMethods = {
  isEventDefDraggable: InteractiveDateComponent.prototype.isEventDefDraggable
}


// configuration for subclasses
// whether we should attempt to render selections or resizes that span across different resources
InteractiveDateComponent.prototype.allowCrossResource = true
// ^ is this worth the complexity?


// if an event's dates are not draggable, but it's resource IS, still allow dragging
InteractiveDateComponent.prototype.isEventDefDraggable = function(eventDef) {
  return this.isEventDefResourceEditable(eventDef) ||
    origMethods.isEventDefDraggable.call(this, eventDef)
}


InteractiveDateComponent.prototype.isEventDefResourceEditable = function(eventDef) {
  let bool = eventDef.resourceEditable

  if (bool == null) {
    bool = (eventDef.source || {}).resourceEditable

    if (bool == null) {
      bool = this.opt('eventResourceEditable')

      if (bool == null) {
        bool = this.isEventDefGenerallyEditable(eventDef)
      }
    }
  }

  return bool
}
