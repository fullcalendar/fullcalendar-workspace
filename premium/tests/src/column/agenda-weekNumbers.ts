import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('timegrid view weekNumbers', () => {
  pushOptions({
    initialView: 'resourceTimeGridWeek',
    initialDate: '2020-12-17',
    weekNumbers: true,
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
    ],
  })

  it('only renders in date row when dates ABOVE resources', () => {
    let calendar = initCalendar({
      datesAboveResources: true,
    })
    let headerWrapper = new ResourceTimeGridViewWrapper(calendar).header
    let weekNumberStrings = headerWrapper.getWeekNumberStrings()
    expect(weekNumberStrings).toEqual(['W 51', ''])
  })

  it('only renders in date row when dates BELOW resources', () => {
    let calendar = initCalendar({
      datesAboveResources: false,
    })
    let headerWrapper = new ResourceTimeGridViewWrapper(calendar).header
    let weekNumberStrings = headerWrapper.getWeekNumberStrings()
    expect(weekNumberStrings).toEqual(['', 'W 51'])
  })
})
