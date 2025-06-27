import { CalendarApi } from './api/CalendarApi.js'
import { Calendar } from './Calendar.js'
import { ViewApi} from './api/ViewApi.js'
import { ButtonStateMap, NavButtonState } from './structs/button-state.js'
import { DateInput } from './datelib/env.js'
import { DurationInput } from './datelib/duration.js'

const blankButtonState: NavButtonState = {
  text: '', hint: '', isDisabled: false,
}

export class CalendarController {
  private calendarApi?: CalendarApi

  constructor(
    private handleDateChange: () => void,
  ) {}

  today(): void {
    this.calendarApi?.today()
  }

  prev(): void {
    this.calendarApi?.prev()
  }

  next(): void {
    this.calendarApi?.next()
  }

  gotoDate(zonedDateInput: DateInput): void {
    this.calendarApi?.gotoDate(zonedDateInput)
  }

  incrementDate(duration: DurationInput): void {
    this.calendarApi?.incrementDate(duration)
  }

  get view(): ViewApi | undefined {
    return this.calendarApi?.view
  }

  getDate(): Date | undefined {
    return this.calendarApi?.getDate()
  }

  getButtonState(): ButtonStateMap {
    const { calendarApi } = this

    return (calendarApi && (calendarApi as Calendar).getButtonState()) || {
      today: blankButtonState,
      prev: blankButtonState,
      next: blankButtonState,
      prevYear: blankButtonState,
      nextYear: blankButtonState,
    }
  }

  _setApi(calendarApi: CalendarApi | undefined): void {
    if (this.calendarApi !== calendarApi) {
      if (this.calendarApi) {
        this.calendarApi.off('datesSet', this.handleDateChange)
        this.calendarApi = undefined
      }
      if (calendarApi) {
        this.calendarApi = calendarApi
        calendarApi.on('datesSet', this.handleDateChange)
      }
    }
  }
}
