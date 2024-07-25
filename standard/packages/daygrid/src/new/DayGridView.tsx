import {
  BaseComponent,
  DateMarker,
  DateRange,
  NowTimer,
  ViewProps,
  memoize
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DayTableSlicer } from '../DayTableSlicer.js'
import { DateHeaderCell } from './header-cells/DateHeaderCell.js'
import { DayGridLayout } from './DayGridLayout.js'
import { DayOfWeekHeaderCell } from './header-cells/DayOfWeekHeaderCell.js'
import { buildDayTableModel, buildHeaderTiers, createDayHeaderFormatter, DateHeaderCellObj, DayOfWeekHeaderCellObj } from './util.js'

export class DayGridView extends BaseComponent<ViewProps> {
  // memo
  private buildDayTableModel = memoize(buildDayTableModel)
  private buildHeaderTiers = memoize(buildHeaderTiers)
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)

  // internal
  private slicer = new DayTableSlicer()

  render() {
    const { props, context } = this
    const { options } = context
    const dayTableModel = this.buildDayTableModel(props.dateProfile, context.dateProfileGenerator)
    const datesRepDistinctDays = dayTableModel.rowCnt === 1

    const headerTiers = this.buildHeaderTiers(dayTableModel.headerDates, datesRepDistinctDays)
    const slicedProps = this.slicer.sliceProps(props, props.dateProfile, options.nextDayThreshold, context, dayTableModel)
    const dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      datesRepDistinctDays,
      dayTableModel.cells.length,
    )

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <DayGridLayout
            dateProfile={props.dateProfile}
            todayRange={todayRange}
            cellRows={dayTableModel.cells}
            forPrint={props.forPrint}

            // header content
            headerTiers={headerTiers}
            renderHeaderContent={(model) => {
              if ((model as DateHeaderCellObj).date) {
                return (
                  <DateHeaderCell
                    {...(model as DateHeaderCellObj)}
                    dateProfile={props.dateProfile}
                    todayRange={todayRange}
                    navLink={dayTableModel.colCnt > 1}
                    dayHeaderFormat={dayHeaderFormat}
                    colSpan={model.colSpan}
                    colWidth={undefined}
                  />
                )
              } else {
                return (
                  <DayOfWeekHeaderCell
                    {...(model as DayOfWeekHeaderCellObj)}
                    dayHeaderFormat={dayHeaderFormat}
                    colSpan={model.colSpan}
                    colWidth={undefined}
                  />
                )
              }
            }}
            getHeaderModelKey={(model) => {
              if ((model as DateHeaderCellObj).date) {
                return (model as DateHeaderCellObj).date.toUTCString()
              }
              return (model as DayOfWeekHeaderCellObj).dow
            }}

            // body content
            fgEventSegs={slicedProps.fgEventSegs}
            bgEventSegs={slicedProps.bgEventSegs}
            businessHourSegs={slicedProps.businessHourSegs}
            dateSelectionSegs={slicedProps.dateSelectionSegs}
            eventDrag={slicedProps.eventDrag}
            eventResize={slicedProps.eventResize}
            eventSelection={slicedProps.eventSelection}
          />
        )}
      </NowTimer>
    )
  }
}
