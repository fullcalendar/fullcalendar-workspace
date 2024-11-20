import {
  BaseComponent,
  DateMarker,
  DateRange,
  memoize,
  NowTimer,
  ViewProps
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DayTableSlicer } from '../DayTableSlicer.js'
import { buildDateRowConfigs } from '../header-tier.js'
import { DayGridLayout } from './DayGridLayout.js'
import { createDayHeaderFormatter } from './util.js'
import { buildDayTableModel } from './util.js'

export class DayGridView extends BaseComponent<ViewProps> {
  // memo
  private buildDayTableModel = memoize(buildDayTableModel)
  private buildDateRowConfigs = memoize(buildDateRowConfigs)
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)

  // internal
  private slicer = new DayTableSlicer()

  render() {
    const { props, context } = this
    const { options } = context
    const dayTableModel = this.buildDayTableModel(props.dateProfile, context.dateProfileGenerator)
    const datesRepDistinctDays = dayTableModel.rowCnt === 1
    const dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      datesRepDistinctDays,
      dayTableModel.colCnt,
    )
    const slicedProps = this.slicer.sliceProps(props, props.dateProfile, options.nextDayThreshold, context, dayTableModel)

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const headerTiers = this.buildDateRowConfigs(
            dayTableModel.headerDates,
            datesRepDistinctDays,
            props.dateProfile,
            todayRange,
            dayHeaderFormat,
            context,
          )

          return (
            <DayGridLayout
              dateProfile={props.dateProfile}
              todayRange={todayRange}
              cellRows={dayTableModel.cellRows}
              forPrint={props.forPrint}
              className='fc-daygrid'

              // header content
              headerTiers={headerTiers}

              // body content
              fgEventSegs={slicedProps.fgEventSegs}
              bgEventSegs={slicedProps.bgEventSegs}
              businessHourSegs={slicedProps.businessHourSegs}
              dateSelectionSegs={slicedProps.dateSelectionSegs}
              eventDrag={slicedProps.eventDrag}
              eventResize={slicedProps.eventResize}
              eventSelection={slicedProps.eventSelection}
            />
          )
        }}
      </NowTimer>
    )
  }
}
