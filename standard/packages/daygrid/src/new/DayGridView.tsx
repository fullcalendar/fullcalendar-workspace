import {
  DateComponent,
  DateMarker,
  DateProfile,
  DateProfileGenerator,
  DateRange,
  DaySeriesModel,
  DayTableModel,
  NowTimer,
  ViewProps,
  memoize
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DayTableSlicer } from '../DayTableSlicer.js'
import { DateHeaderCell } from './DateHeaderCell.js'
import { DayGridLayout } from './DayGridLayout.js'
import { DayOfWeekHeaderCell } from './DayOfWeekHeaderCell.js'

export class DayGridView extends DateComponent<ViewProps> {
  private buildDayTableModel = memoize(buildDayTableModel)
  private slicer = new DayTableSlicer()

  render() {
    const { props, context } = this
    const { options } = context
    const dayTableModel = this.buildDayTableModel(props.dateProfile, context.dateProfileGenerator)
    const datesRepDistinctDays = dayTableModel.rowCnt === 1

    const headerTiers: (
      { type: 'date', colSpan: number, date: DateMarker } |
      { type: 'dayOfWeek', colSpan: number, dow: number }
    )[][] = [
      datesRepDistinctDays // TODO: memoize. TODO: DRY-up?
        ? dayTableModel.headerDates.map((date) => ({ type: 'date', colSpan: 1, date }))
        : dayTableModel.headerDates.map((date) => ({ type: 'dayOfWeek', colSpan: 1, dow: date.getUTCDay() }))
    ]

    const slicedProps = this.slicer.sliceProps(props, props.dateProfile, options.nextDayThreshold, context, dayTableModel)

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <DayGridLayout
            dateProfile={props.dateProfile}
            cellRows={dayTableModel.cells /* TODO: do some renaming */}
            headerTiers={headerTiers}
            renderHeaderContent={(model) => {
              if (model.type === 'date') {
                return (
                  <DateHeaderCell
                    cell={model}
                    navLink={dayTableModel.colCnt > 1 /* correct? */}
                    dateProfile={props.dateProfile}
                    todayRange={todayRange}
                    dayHeaderFormat={undefined /* TODO: figure `dayHeaderFormat` out */}
                    colSpan={model.colSpan}
                    colWidth={undefined}
                  />
                )
              } else { // 'dayOfWeek'
                return (
                  <DayOfWeekHeaderCell
                    key={model.dow}
                    cell={model}
                    dayHeaderFormat={undefined /* TODO: figure `dayHeaderFormat` out */}
                    colSpan={model.colSpan}
                    colWidth={undefined}
                  />
                )
              }
            }}
            getHeaderModelKey={(model) => {
              if (model.type === 'date') {
                return model.date.toUTCString()
              }
              return model.dow
            }}
            businessHourSegs={slicedProps.businessHourSegs}
            bgEventSegs={slicedProps.businessHourSegs}
            fgEventSegs={slicedProps.businessHourSegs}
            dateSelectionSegs={slicedProps.businessHourSegs}
            eventSelection={slicedProps.eventSelection}
            eventDrag={slicedProps.eventDrag}
            eventResize={slicedProps.eventResize}
            forPrint={props.forPrint}
            isHeightAuto={props.isHeightAuto}
          />
        )}
      </NowTimer>
    )
  }
}

// TODO: move to utils
export function buildDayTableModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator) {
  let daySeries = new DaySeriesModel(dateProfile.renderRange, dateProfileGenerator)

  return new DayTableModel(
    daySeries,
    /year|month|week/.test(dateProfile.currentRangeUnit),
  )
}
