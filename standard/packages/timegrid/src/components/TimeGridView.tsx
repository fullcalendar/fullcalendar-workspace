import { DateComponent, ViewProps, memoize, DateMarker, NowTimer, DateRange, EventRangeProps } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { DateHeaderCell, DayTableSlicer } from '@fullcalendar/daygrid/internal'
import { buildDayRanges, buildTimeColsModel } from "./util.js"
import { AllDaySplitter } from "../AllDaySplitter.js"
import { DayTimeColsSlicer } from "../DayTimeColsSlicer.js"
import { splitInteractionByCol, organizeSegsByCol, TimeGridRange } from "../TimeColsSeg.js"
import { TimeGridWeekNumber } from "./TimeGridWeekNumber.js"
import { TimeGridLayout } from './TimeGridLayout.js'
import { createDayHeaderFormatter } from '@fullcalendar/daygrid/internal'

export class TimeGridView extends DateComponent<ViewProps> {
  // memo
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)
  private buildTimeColsModel = memoize(buildTimeColsModel)
  private buildDayRanges = memoize(buildDayRanges)
  private splitFgEventSegs = memoize(organizeSegsByCol<TimeGridRange & EventRangeProps>)
  private splitBgEventSegs = memoize(organizeSegsByCol<TimeGridRange & EventRangeProps>)
  private splitBusinessHourSegs = memoize(organizeSegsByCol<TimeGridRange & EventRangeProps>)
  private splitNowIndicatorSegs = memoize(organizeSegsByCol<TimeGridRange>)
  private splitDateSelectionSegs = memoize(organizeSegsByCol<TimeGridRange & EventRangeProps>)
  private splitEventDrag = memoize(splitInteractionByCol)
  private splitEventResize = memoize(splitInteractionByCol)

  // internal
  private allDaySplitter = new AllDaySplitter()
  private dayTableSlicer = new DayTableSlicer()
  private dayTimeColsSlicer = new DayTimeColsSlicer()

  render() {
    const { props, context } = this
    const { dateProfile } = props
    const { options, dateProfileGenerator } = context

    const dayTableModel = this.buildTimeColsModel(dateProfile, dateProfileGenerator)
    const dayRanges = this.buildDayRanges(dayTableModel, dateProfile, context.dateEnv)
    const splitProps = this.allDaySplitter.splitProps(props)
    const allDayProps = this.dayTableSlicer.sliceProps(
      splitProps.allDay,
      dateProfile,
      options.nextDayThreshold,
      context,
      dayTableModel,
    )
    const timedProps = this.dayTimeColsSlicer.sliceProps(
      splitProps.timed,
      dateProfile,
      null,
      context,
      dayRanges,
    )
    const dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      true, // datesRepDistinctDays
      dayTableModel.colCnt,
    )

    return (
      <NowTimer unit={options.nowIndicator ? 'minute' : 'day' /* hacky */}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const colCnt = dayTableModel.cellRows[0].length
          const nowIndicatorSeg = options.nowIndicator &&
            this.dayTimeColsSlicer.sliceNowDate(nowDate, dateProfile, options.nextDayThreshold, context, dayRanges)

          const fgEventSegsByCol = this.splitFgEventSegs(timedProps.fgEventSegs, colCnt)
          const bgEventSegsByCol = this.splitBgEventSegs(timedProps.bgEventSegs, colCnt)
          const businessHourSegsByCol = this.splitBusinessHourSegs(timedProps.businessHourSegs, colCnt)
          const nowIndicatorSegsByCol = this.splitNowIndicatorSegs(nowIndicatorSeg, colCnt)
          const dateSelectionSegsByCol = this.splitDateSelectionSegs(timedProps.dateSelectionSegs, colCnt)
          const eventDragByCol = this.splitEventDrag(timedProps.eventDrag, colCnt)
          const eventResizeByCol = this.splitEventResize(timedProps.eventResize, colCnt)

          return (
            <TimeGridLayout
              dateProfile={dateProfile}
              nowDate={nowDate}
              todayRange={todayRange}
              cells={dayTableModel.cellRows[0]}
              forPrint={props.forPrint}
              className='fc-timegrid-view'

              // header content
              headerTiers={dayTableModel.cellRows /* guaranteed to be one row */}
              renderHeaderLabel={(tierNum, innerWidthRef, innerHeightRef, width) => (
                options.weekNumbers ? (
                  <TimeGridWeekNumber // .fc-cell
                    dateProfile={dateProfile}
                    innerWidthRef={innerWidthRef}
                    innerHeightRef={innerHeightRef}
                    width={width}
                  />
                ) : (
                  <div
                    className='fc-timegrid-axis fc-cell fc-content-box'
                    style={{ width }}
                  />
                )
              )}
              renderHeaderContent={(cell, tierNum, innerHeightRef, colWidth) => (
                <DateHeaderCell
                  {...cell /* for date & renderProps/etc */}
                  dateProfile={dateProfile}
                  todayRange={todayRange}
                  navLink={dayTableModel.colCnt > 1}
                  dayHeaderFormat={dayHeaderFormat}
                  innerHeightRef={innerHeightRef}
                  colWidth={colWidth}
                />
              )}
              getHeaderModelKey={(cell) => cell.key}

              // all-day content
              fgEventSegs={allDayProps.fgEventSegs}
              bgEventSegs={allDayProps.bgEventSegs}
              businessHourSegs={allDayProps.businessHourSegs}
              dateSelectionSegs={allDayProps.dateSelectionSegs}
              eventDrag={allDayProps.eventDrag}
              eventResize={allDayProps.eventResize}

              // timed content
              fgEventSegsByCol={fgEventSegsByCol}
              bgEventSegsByCol={bgEventSegsByCol}
              businessHourSegsByCol={businessHourSegsByCol}
              nowIndicatorSegsByCol={nowIndicatorSegsByCol}
              dateSelectionSegsByCol={dateSelectionSegsByCol}
              eventDragByCol={eventDragByCol}
              eventResizeByCol={eventResizeByCol}

              // universal content
              eventSelection={props.eventSelection}
            />
          )
        }}
      </NowTimer>
    )
  }
}
