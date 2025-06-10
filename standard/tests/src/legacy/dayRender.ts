import { formatIsoDay } from '../lib/datelib-utils.js'
import { DayGridViewWrapper } from '../lib/wrappers/DayGridViewWrapper.js'

describe('dayCellDidMount', () => { // TODO: rename file
  it('is triggered upon initialization of a view, with correct parameters', () => {
    let options = {
      initialView: 'dayGridMonth',
      fixedWeekCount: true,
      initialDate: '2014-05-01',
      dayCellDidMount(data) {
        expect(data.date instanceof Date).toEqual(true)
        expect(formatIsoDay(data.date)).toEqual(data.el.getAttribute('data-date'))
        expect(data.el instanceof HTMLElement).toBe(true)
      },
    }

    spyOn(options, 'dayCellDidMount').and.callThrough()
    initCalendar(options)
    expect(options.dayCellDidMount.calls.count()).toEqual(42)
  })

  it('is called when date range is changed', () => {
    let options = {
      initialView: 'dayGridWeek',
      initialDate: '2014-05-01',
      dayCellDidMount(data) { },
    }

    spyOn(options, 'dayCellDidMount').and.callThrough()
    initCalendar(options)
    options.dayCellDidMount.calls.reset()
    currentCalendar.gotoDate('2014-05-04') // a day in the next week
    expect(options.dayCellDidMount.calls.count()).toEqual(7)
  })

  it('won\'t be called when date is navigated but remains in the current visible range', () => {
    let options = {
      initialView: 'dayGridWeek',
      initialDate: '2014-05-01',
      dayCellDidMount(data) { },
    }

    spyOn(options, 'dayCellDidMount').and.callThrough()
    initCalendar(options)
    options.dayCellDidMount.calls.reset()
    currentCalendar.gotoDate('2014-05-02') // a day in the same week
    expect(options.dayCellDidMount.calls.count()).toEqual(0)
  })

  it('allows you to modify the element', () => {
    let options = {
      initialView: 'dayGridMonth',
      fixedWeekCount: true,
      initialDate: '2014-05-01',
      dayCellDidMount(data) {
        if (formatIsoDay(data.date) === '2014-05-01') {
          data.el.classList.add('mycustomclass')
        }
      },
    }

    let calendar = initCalendar(options)
    let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
    let dayEl = dayGridWrapper.getDayEl('2014-05-01')
    expect(dayEl).toHaveClass('mycustomclass')
  })

  it('gets called for TimeGrid views', () => {
    let callCnt = 0
    let options = {
      initialView: 'timeGridWeek',
      initialDate: '2014-05-01',
      allDaySlot: false, // turn off. fires its own dayCellDidMount
      dayCellDidMount(data) {
        expect(data.date instanceof Date).toBe(true)
        expect(data.el instanceof HTMLElement).toBe(true)
        expect(typeof data.view).toBe('object')
        callCnt += 1
      },
    }

    initCalendar(options)
    expect(callCnt).toBe(7)
  })
})
