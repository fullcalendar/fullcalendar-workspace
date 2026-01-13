import { CalendarDataManager } from './reducers/CalendarDataManager.js'
import { CalendarOptions } from './options.js'
import { CalendarApiImpl } from './api/CalendarApiImpl.js'
import { CalendarApi } from './api/CalendarApi.js'
import { CalendarData } from './reducers/data-types.js'
import { StrictMode } from 'react'
import { PureComponent } from './vdom-util.js'
import { CalendarMediaRoot, computeRootClassName } from './calendar-root.js'
import { CalendarInner } from './CalendarInner.js'
import { memoize } from './util/memoize.js'

export class CalendarComponent extends PureComponent<CalendarOptions> {
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
