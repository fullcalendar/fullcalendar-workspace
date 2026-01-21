describe('fetching resources with a function', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
  })

  it('can call success for cycling through loading state', () => {
    const loadingBools: boolean[] = []

    const calendar = initCalendar({
      loading(bool) {
        loadingBools.push(bool)
      },
      resources(arg, successCallback) {
        successCallback([
          { id: 'a' },
        ])
      },
    })

    expect(calendar.getResources().length).toBe(1)
    expect(loadingBools).toEqual([true, false])
  })

  it('can call failure for cycling through loading state', () => {
    const loadingBools: boolean[] = []

    initCalendar({
      loading(bool) {
        loadingBools.push(bool)
      },
      resources(arg, successCallback, failureCallback) {
        failureCallback(new Error())
      },
    })

    expect(loadingBools).toEqual([true, false])
  })
})
