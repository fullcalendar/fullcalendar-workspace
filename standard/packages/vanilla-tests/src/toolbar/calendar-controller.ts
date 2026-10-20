import { Calendar, CalendarController } from 'fullcalendar'

describe('CalendarController', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2024-01-15',
  })

  it('is bound to the calendar while rendered', () => {
    let handleDateChange = jasmine.createSpy('handleDateChange')
    let controller = new CalendarController(handleDateChange)
    let calendar = initCalendar({ controller })

    expect(controller.view.type).toBe('dayGridMonth')
    expect(controller.getButtonState().next.isDisabled).toBe(false)

    handleDateChange.calls.reset()
    calendar.next()
    expect(handleDateChange).toHaveBeenCalled()
  })

  it('works without a date-change handler', () => {
    let controller = new CalendarController()
    let calendar = initCalendar({ controller })

    calendar.next()
    expect(controller.getDate()).toEqualDate('2024-02-01')
  })

  it('is unbound when the calendar is destroyed', () => {
    let controller = new CalendarController(() => {})
    let calendar = initCalendar({ controller })

    calendar.destroy()

    expect(controller.view).toBeUndefined()
    expect(controller.getDate()).toBeUndefined()
    expect(controller.getButtonState().next.text).toBe('')
  })

  it('is unbound when the calendar is destroyed before rendering', () => {
    let controller = new CalendarController(() => {})
    let calendar = new Calendar(document.createElement('div'), {
      ...getCurrentOptions(),
      controller,
    })

    expect(controller.view.type).toBe('dayGridMonth') // usable before render

    calendar.destroy()
    expect(controller.view).toBeUndefined()
  })

  it('unbinds the previous controller when replaced', () => {
    let controllerA = new CalendarController(() => {})
    let controllerB = new CalendarController(() => {})
    let calendar = initCalendar({ controller: controllerA })

    calendar.setOption('controller', controllerB)

    expect(controllerA.view).toBeUndefined()
    expect(controllerB.view.type).toBe('dayGridMonth')
  })

  it('unbinds controllers replaced without rendering in between', () => {
    let controllerA = new CalendarController(() => {})
    let controllerB = new CalendarController(() => {})
    let controllerC = new CalendarController(() => {})
    let calendar = initCalendar({ controller: controllerA })

    calendar.batchRendering(() => {
      calendar.setOption('controller', controllerB)
      calendar.setOption('controller', controllerC)
    })

    expect(controllerA.view).toBeUndefined()
    expect(controllerB.view).toBeUndefined()
    expect(controllerC.view.type).toBe('dayGridMonth')
  })

  it('unbinds the controller when the option is removed', () => {
    let controller = new CalendarController(() => {})
    let calendar = initCalendar({ controller })

    calendar.setOption('controller', undefined)

    expect(controller.view).toBeUndefined()
  })

  it('keeps a controller swapped in by the initial datesSet', () => {
    let controllerA = new CalendarController(() => {})
    let controllerB = new CalendarController(() => {})
    let calendar = initCalendar({
      controller: controllerA,
      datesSet(this: any) {
        if (this.getOption('controller') === controllerA) {
          this.setOption('controller', controllerB)
        }
      },
    })

    expect(controllerA.view).toBeUndefined()
    expect(controllerB.view.type).toBe('dayGridMonth')

    calendar.destroy()
    expect(controllerB.view).toBeUndefined()
  })

  it('is not taken back by a destroyed calendar that renders again', () => {
    let controller = new CalendarController(() => {})
    let calendarX = initCalendar({ controller })

    calendarX.destroy()
    initCalendar({ controller, initialView: 'timeGridWeek' })
    calendarX.render()

    expect(controller.view.type).toBe('timeGridWeek')
  })

  it('can be bound to a new calendar after the old one is destroyed', () => {
    let controller = new CalendarController(() => {})

    initCalendar({ controller }).destroy()
    initCalendar({ controller, initialView: 'timeGridWeek' })

    expect(controller.view.type).toBe('timeGridWeek')
  })
})
