import * as $ from 'jquery'
import { Mixin, View } from 'fullcalendar'


export interface ResourceViewInterface {
  initResourceView()
  getResourceTextFunc()
}


export default class ResourceViewMixin extends Mixin implements ResourceViewInterface {

  resourceTextFunc: any
  isResourcesRendered: boolean // (initialized after class)

  // for View
  calendar: any
  canHandleSpecificResources: boolean


  static mixInto(destClass) {
    Mixin.mixInto.call(this, destClass);
    [ // methods that will override destination class'
      'bindBaseRenderHandlers',
      'queryScroll',
      'applyScroll',
      'triggerDayClick',
      'triggerSelect',
      'triggerExternalDrop',
      'handleResourceAdd',
      'handleResourceRemove'
    ].forEach((methodName) => {
      destClass.prototype[methodName] = this.prototype[methodName]
    })
  }


  initResourceView() {

    // new task
    const resourceDeps = [ 'hasResources' ]
    if (!this.canHandleSpecificResources) {
      resourceDeps.push('displayingDates')
    }
    (this as any).watch('displayingResources', resourceDeps, () => {
      this.requestResourcesRender((this as any).get('currentResources'))
    }, () => {
      this.requestResourcesUnrender()
    });

    // start relying on displayingResources
    (this as any).watch('displayingBusinessHours', [
      'businessHourGenerator',
      'displayingResources',
      'displayingDates'
    ], (deps) => {
      (this as any).requestBusinessHoursRender(deps.businessHourGenerator)
    }, () => {
      (this as any).requestBusinessHoursUnrender()
    });

    // start relying on resource displaying rather than just current resources
    (this as any).watch('displayingEvents', [ 'displayingResources', 'hasEvents' ], () => {
      (this as any).requestEventsRender((this as any).get('currentEvents'))
    }, () => {
      (this as any).requestEventsUnrender()
    })
  }


  // Logic: base render trigger should fire when BOTH the resources and dates have rendered,
  // but the unrender trigger should fire after ONLY the dates are about to be unrendered.
  bindBaseRenderHandlers() {
    let isResourcesRendered = false
    let isDatesRendered = false;

    (this as any).on('resourcesRendered', function() {
      if (!isResourcesRendered) {
        isResourcesRendered = true
        if (isDatesRendered) {
          this.whenSizeUpdated(this.triggerViewRender)
        }
      }
    });

    (this as any).on('datesRendered', function() {
      if (!isDatesRendered) {
        isDatesRendered = true
        if (isResourcesRendered) {
          this.whenSizeUpdated(this.triggerViewRender)
        }
      }
    });

    (this as any).on('before:resourcesUnrendered', function() {
      if (isResourcesRendered) {
        isResourcesRendered = false
      }
    });

    (this as any).on('before:datesUnrendered', function() {
      if (isDatesRendered) {
        isDatesRendered = false
        this.triggerViewDestroy()
      }
    })
  }


  // Scroll
  // ----------------------------------------------------------------------------------------------


  queryScroll() {
    const scroll = View.prototype.queryScroll.apply(this, arguments)

    if (this.isResourcesRendered) {
      $.extend(scroll, this.queryResourceScroll())
    }

    return scroll
  }


  applyScroll(scroll) {
    View.prototype.applyScroll.apply(this, arguments)

    if (this.isResourcesRendered) {
      (this as any).applyResourceScroll(scroll)
    }
  }


  queryResourceScroll() {
    return {} // subclasses must implement
  }


  applyResourceScroll() {
    // subclasses must implement
  }


  // Rendering Utils
  // ----------------------------------------------------------------------------------------------


  getResourceText(resource) {
    return this.getResourceTextFunc()(resource)
  }


  getResourceTextFunc() {
    if (this.resourceTextFunc) {
      return this.resourceTextFunc
    } else {
      let func = (this as any).opt('resourceText')
      if (typeof func !== 'function') {
        func = resource => resource.title || resource.id
      }
      this.resourceTextFunc = func
      return func
    }
  }


  // Resource Change Handling
  // ----------------------------------------------------------------------------------------------


  handleResourceAdd(resource) {
    this.requestResourceRender(resource)
  }


  handleResourceRemove(resource) {
    this.requestResourceUnrender(resource)
  }


  // Resource Rendering
  // ----------------------------------------------------------------------------------------------


  requestResourcesRender(resources) {
    (this as any).requestRender(() => {
      this.executeResourcesRender(resources)
    }, 'resource', 'init')
  }


  requestResourcesUnrender() {
    (this as any).requestRender(() => {
      this.executeResourcesUnrender()
    }, 'resource', 'destroy')
  }


  requestResourceRender(resource) {
    (this as any).requestRender(() => {
      this.executeResourceRender(resource)
    }, 'resource', 'add')
  }


  requestResourceUnrender(resource) {
    (this as any).requestRender(() => {
      this.executeResourceUnrender(resource)
    }, 'resource', 'remove')
  }


  // Resource High-level Rendering/Unrendering
  // ----------------------------------------------------------------------------------------------


  executeResourcesRender(resources) {
    (this as any).renderResources(resources)
    this.isResourcesRendered = true;
    (this as any).trigger('resourcesRendered')
  }


  executeResourcesUnrender() {
    (this as any).trigger('before:resourcesUnrendered');
    (this as any).unrenderResources()
    this.isResourcesRendered = false
  }


  executeResourceRender(resource) {
    (this as any).renderResource(resource)
  }


  executeResourceUnrender(resource) {
    (this as any).unrenderResource(resource)
  }


  // Triggering
  // ----------------------------------------------------------------------------------------------


  /*
  footprint is a ResourceComponentFootprint
  */
  triggerDayClick(footprint, dayEl, ev) {
    const dateProfile = this.calendar.footprintToDateProfile(footprint);

    (this as any).publiclyTrigger('dayClick', {
      context: dayEl,
      args: [
        dateProfile.start,
        ev,
        this,
        footprint.resourceId ?
          this.calendar.resourceManager.getResourceById(footprint.resourceId) :
          null
      ]
    })
  }


  /*
  footprint is a ResourceComponentFootprint
  */
  triggerSelect(footprint, ev) {
    const dateProfile = this.calendar.footprintToDateProfile(footprint);

    (this as any).publiclyTrigger('select', {
      context: this,
      args: [
        dateProfile.start,
        dateProfile.end,
        ev,
        this,
        footprint.resourceId ?
          this.calendar.resourceManager.getResourceById(footprint.resourceId) :
          null
      ]
    })
  }


  // override the view's default trigger in order to provide a resourceId to the `drop` event
  // TODO: make more DRY with core
  triggerExternalDrop(singleEventDef, isEvent, el, ev, ui) {

    // trigger 'drop' regardless of whether element represents an event
    (this as any).publiclyTrigger('drop', {
      context: el[0],
      args: [
        singleEventDef.dateProfile.start.clone(),
        ev,
        ui,
        singleEventDef.getResourceIds()[0],
        this
      ]
    })

    if (isEvent) {
      // signal an external event landed
      (this as any).publiclyTrigger('eventReceive', {
        context: this,
        args: [
          singleEventDef.buildInstance().toLegacy(),
          this
        ]
      })
    }
  }
}

ResourceViewMixin.prototype.isResourcesRendered = false
