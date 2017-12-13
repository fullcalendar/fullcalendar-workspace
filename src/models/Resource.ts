
export default class Resource {


  static extractIds(rawProps, calendar) {
    const resourceField = calendar.opt('eventResourceField') || 'resourceId'
    const resourceIds = []

    if (rawProps.resourceIds) {
      for (let rawResourceId of rawProps.resourceIds) {
        resourceIds.push(Resource.normalizeId(rawResourceId))
      }
    }

    if (rawProps[resourceField] != null) {
      resourceIds.push(Resource.normalizeId(rawProps[resourceField]))
    }

    return resourceIds
  }


  static normalizeId(rawId) {
    return String(rawId)
  }

}
