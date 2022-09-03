import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('vresource resource rerendering', () => {
  pushOptions({
    initialView: 'resourceTimeGridDay',
    resources: [
      { id: 'a', title: 'Auditorium A' },
      { id: 'b', title: 'Auditorium B' },
      { id: 'c', title: 'Auditorium C' },
    ],
  })

  it('adjusts to Resource::remove', () => {
    let calendar = initCalendar()
    let headerWrapper = new ResourceTimeGridViewWrapper(calendar).header

    expect(headerWrapper.getResourceIds()).toEqual(['a', 'b', 'c'])
    currentCalendar.getResourceById('a').remove()
    expect(headerWrapper.getResourceIds()).toEqual(['b', 'c'])
  })

  it('adjusts to addResource', () => {
    let calendar = initCalendar()
    let headerWrapper = new ResourceTimeGridViewWrapper(calendar).header

    expect(headerWrapper.getResourceIds()).toEqual(['a', 'b', 'c'])

    currentCalendar.addResource({
      id: 'd',
      title: 'Auditorium D',
    })

    expect(headerWrapper.getResourceIds()).toEqual(['a', 'b', 'c', 'd'])
  })
})
