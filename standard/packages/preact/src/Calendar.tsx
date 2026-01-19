import { CalendarDataManager } from './reducers/CalendarDataManager'
import { CalendarOptions } from './options'
import { CalendarApiImpl } from './api/CalendarApiImpl'
import { CalendarApi } from './api/CalendarApi'
import { CalendarData } from './reducers/data-types'
import { StrictMode } from 'react'
import { PureComponent } from './vdom-util'
import { CalendarMediaRoot, computeRootClassName } from './calendar-root'
import { CalendarInner } from './CalendarInner'
import { memoize } from './util/memoize'

export class Calendar extends PureComponent<CalendarOptions> {
  private dataManager: CalendarDataManager | undefined
  private currentData: CalendarData | undefined
  private _api = new CalendarApiImpl()
  private computeRootClassName = memoize(computeRootClassName)

  render() {
    const { props } = this

    if (!this.dataManager) {
      this.dataManager = new CalendarDataManager({
        optionOverrides: props,
        calendarApi: this._api,
        onData: this.handleData,
      })
    } else {
      this.dataManager.resetOptions(props)
    }

    // populated by CalendarDataManager constructor or resetOptions
    const { currentData } = this

    return (
      <StrictMode>
        <CalendarMediaRoot emitter={currentData.emitter}>
          {(forPrint: boolean) => {
            const options = currentData.calendarOptions
            const isRtl = options.direction === 'rtl'
            const className = this.computeRootClassName(options, forPrint)

            return (
              <div
                dir={isRtl ? 'rtl' : undefined}
                className={className}
                style={{ height: options.height }}
              >
                <CalendarInner {...currentData} forPrint={forPrint} />
              </div>
            )
          }}
        </CalendarMediaRoot>
      </StrictMode>
    )
  }

  private handleData = (data: CalendarData) => {
    this.currentData = data
    this.forceUpdate()
  }

  componentWillUnmount(): void {
    this.dataManager.destroy()
  }

  getApi(): CalendarApi {
    return this._api
  }
}
