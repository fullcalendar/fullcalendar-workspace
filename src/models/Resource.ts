
export default class Resource {


  static extractIds(rawProps, source) {
    const resourceField = source.calendar.opt('eventResourceField') || 'resourceId'
    const resourceIds = []

    if (rawProps.resourceIds) {
      for (let rawResourceId of rawProps.resourceIds) {
        resourceIds.push(Resource.normalizeId(rawResourceId))
      }
    }

    if (rawProps[resourceField] != null) {
      resourceIds.push(Resource.normalizeId(rawProps[resourceField]))
    }

    if (source[resourceField]) {
      resourceIds.push(Resource.normalizeId(source[resourceField]))
    }

    return resourceIds
  }


  static normalizeId(rawId) {
    return String(rawId)
  }

}
