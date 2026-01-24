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
  private _dataManager: CalendarDataManager | undefined
  private _currentData: CalendarData | undefined
  private _api = new CalendarApiImpl()
  private _computeRootClassName = memoize(computeRootClassName)
  private _inRender = false

  render() {
    const { props } = this

    this._inRender = true
    if (!this._dataManager) {
      this._dataManager = new CalendarDataManager({
        optionOverrides: props,
        calendarApi: this._api,
        onData: this.handleData,
      })
    } else {
      this._dataManager.resetOptions(props)
    }

    // populated by CalendarDataManager constructor or resetOptions
    const { _currentData: currentData } = this
    this._inRender = false

    return (
      <StrictMode>
        <CalendarMediaRoot emitter={currentData.emitter}>
          {(forPrint: boolean) => {
            const options = currentData.calendarOptions
            const isRtl = options.direction === 'rtl'
            const className = this._computeRootClassName(options, forPrint)

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
    this._currentData = data

    if (!this._inRender) {
      this.forceUpdate()
    }
  }

  componentWillUnmount(): void {
    this._dataManager.destroy()
  }

  getApi(): CalendarApi {
    return this._api
  }
}
