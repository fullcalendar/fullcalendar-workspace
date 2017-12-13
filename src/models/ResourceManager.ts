import * as $ from 'jquery'
import { Class, Promise, EmitterMixin, EmitterInterface, BusinessHourGenerator } from 'fullcalendar'


export default class ResourceManager extends Class {

  static resourceGuid = 1
  static ajaxDefaults = {
    dataType: 'json',
    cache: false
  }

  on: EmitterInterface['on']
  one: EmitterInterface['one']
  off: EmitterInterface['off']
  trigger: EmitterInterface['trigger']
  triggerWith: EmitterInterface['triggerWith']
  hasHandlers: EmitterInterface['hasHandlers']

  calendar: any
  fetchId: number
  topLevelResources: any // if null, indicates not fetched
  resourcesById: any
  fetching: any // a promise. the last fetch. never cleared afterwards
  currentStart: any
  currentEnd: any


  constructor(calendar) {
    super()
    this.fetchId = 0
    this.calendar = calendar
    this.initializeCache()
  }


  // Resource Data Getting
  // ------------------------------------------------------------------------------------------------------------------


  /*
  Like fetchResources, but won't refetch if already fetched.
  */
  getResources(start, end) {
    const isSameRange =
      (!start && !this.currentStart) || // both nonexistent ranges?
      (start && this.currentStart && start.isSame(this.currentStart) && end.isSame(this.currentEnd))

    if (!this.fetching || !isSameRange) { // first time? or is range different?
      return this.fetchResources(start, end)
    } else {
      return this.fetching
    }
  }


  /*
  Will always fetch, even if done previously.
  Accepts optional chrono-related params to pass on to the raw resource sources.
  Returns a promise.
  */
  fetchResources(start, end) {
    const currentFetchId = (this.fetchId += 1)

    return this.fetching =
      Promise.construct((resolve, reject) => {
        this.fetchResourceInputs(resourceInputs => {
          if (currentFetchId === this.fetchId) {
            this.setResources(resourceInputs)
            return resolve(this.topLevelResources)
          } else {
            return reject()
          }
        }, start, end)
      })
  }


  /*
  Accepts optional chrono-related params to pass on to the raw resource sources.
  Calls callback when done.
  */
  fetchResourceInputs(callback, start, end) {
    const { calendar } = this
    let source = calendar.opt('resources')
    const timezone = calendar.opt('timezone')

    if ($.type(source) === 'string') {
      source = { url: source }
    }

    switch ($.type(source)) {

      case 'function':
        this.calendar.pushLoading()
        source((resourceInputs) => {
          this.calendar.popLoading()
          callback(resourceInputs)
        }, start, end, calendar.opt('timezone'))
        break

      case 'object':
        calendar.pushLoading()
        let requestParams = {}

        if (start && end) {
          requestParams[calendar.opt('startParam')] = start.format()
          requestParams[calendar.opt('endParam')] = end.format()

          // mimick what EventManager does
          // TODO: more DRY
          if (timezone && (timezone !== 'local')) {
            requestParams[calendar.opt('timezoneParam')] = timezone
          }
        }

        $.ajax( // TODO: handle failure
          $.extend(
            { data: requestParams },
            ResourceManager.ajaxDefaults,
            source
          )
        ).then(resourceInputs => {
          calendar.popLoading()
          callback(resourceInputs)
        })

        break

      case 'array':
        callback(source)
        break

      default:
        callback([])
        break
    }
  }


  getResourceById(id) { // assumes already returned from fetch
    return this.resourcesById[id]
  }


  // assumes already completed fetch
  // does not guarantee order
  getFlatResources() {
    const result = []

    for (let id in this.resourcesById) {
      result.push(this.resourcesById[id])
    }

    return result
  }


  // Resource Adding
  // ------------------------------------------------------------------------------------------------------------------


  initializeCache() {
    this.topLevelResources = []
    this.resourcesById = {}
  }


  setResources(resourceInputs) {
    let resource
    const wasSet = Boolean(this.topLevelResources)
    this.initializeCache()

    const resources = resourceInputs.map((resourceInput) => (
      this.buildResource(resourceInput)
    ))

    const validResources = []

    for (resource of resources) {
      if (this.addResourceToIndex(resource)) {
        validResources.push(resource)
      }
    }

    for (resource of validResources) {
      this.addResourceToTree(resource)
    }

    if (wasSet) {
      this.trigger('reset', this.topLevelResources)
    } else {
      this.trigger('set', this.topLevelResources)
    }

    this.calendar.publiclyTrigger('resourcesSet', [ this.topLevelResources ])
  }


  resetCurrentResources() { // resend what we already have
    if (this.topLevelResources) {
      this.trigger('reset', this.topLevelResources)
    }
  }


  clear() {
    this.topLevelResources = null
    this.fetching = null
  }


  addResource(resourceInput) { // returns a promise
    if (this.fetching) {
      return this.fetching.then(() => { // wait for initial batch of resources
        const resource = this.buildResource(resourceInput)
        if (this.addResourceToIndex(resource)) {
          this.addResourceToTree(resource)
          this.trigger('add', resource , this.topLevelResources)
          return resource
        } else {
          return false
        }
      })
    } else {
      return Promise.reject()
    }
  }


  addResourceToIndex(resource) {
    if (this.resourcesById[resource.id]) {
      return false
    } else {
      this.resourcesById[resource.id] = resource

      for (let child of resource.children) {
        this.addResourceToIndex(child)
      }

      return true
    }
  }


  addResourceToTree(resource) {
    if (!resource.parent) {
      let siblings
      const parentId = String(resource['parentId'] != null ? resource['parentId'] : '')

      if (parentId) {
        const parent = this.resourcesById[parentId]
        if (parent) {
          resource.parent = parent
          siblings = parent.children
        } else {
          return false
        }
      } else {
        siblings = this.topLevelResources
      }

      siblings.push(resource)
    }

    return true
  }


  // Resource Removing
  // ------------------------------------------------------------------------------------------------------------------


  removeResource(idOrResource) {
    const id =
      typeof idOrResource === 'object' ?
        idOrResource.id :
        idOrResource

    if (this.fetching) {
      return this.fetching.then(() => { // wait for initial batch of resources
        const resource = this.removeResourceFromIndex(id)

        if (resource) {
          this.removeResourceFromTree(resource)
          this.trigger('remove', resource, this.topLevelResources)
        }

        return resource
      })
    } else {
      return Promise.reject()
    }
  }


  removeResourceFromIndex(resourceId) {
    const resource = this.resourcesById[resourceId]

    if (resource) {
      delete this.resourcesById[resourceId]

      for (let child of resource.children) {
        this.removeResourceFromIndex(child.id)
      }

      return resource
    } else {
      return false
    }
  }


  removeResourceFromTree(resource, siblings = this.topLevelResources) {

    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i]

      if (sibling === resource) {
        resource.parent = null
        siblings.splice(i, 1)
        return true
      }

      if (this.removeResourceFromTree(resource, sibling.children)) {
        return true
      }
    }

    return false
  }


  // Resource Data Utils
  // ------------------------------------------------------------------------------------------------------------------


  buildResource(resourceInput) {
    const resource = $.extend({}, resourceInput)
    const rawClassName = resourceInput.eventClassName

    resource.id = String(
      resourceInput.id != null ?
        resourceInput.id :
        '_fc' + (ResourceManager.resourceGuid++)
    )

    // TODO: consolidate repeat logic
    resource.eventClassName = (function() {
      switch ($.type(rawClassName)) {
        case 'string':
          return rawClassName.split(/\s+/)
        case 'array':
          return rawClassName
        default:
          return []
      }
    })()

    if (resourceInput.businessHours) {
      resource.businessHourGenerator = new BusinessHourGenerator(resourceInput.businessHours, this.calendar)
    }

    resource.children = (resourceInput.children || []).map((childInput) => {
      const child = this.buildResource(childInput)
      child.parent = resource
      return child
    })

    return resource
  }

}

EmitterMixin.mixInto(ResourceManager)
