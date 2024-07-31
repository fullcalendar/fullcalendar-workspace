import { DateComponent, ViewProps, memoize, DateMarker, NowTimer, DateRange } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { DateHeaderCell, DayTableSlicer } from '@fullcalendar/daygrid/internal'
import { buildDayRanges, buildTimeColsModel } from "./util.js"
import { AllDaySplitter } from "../AllDaySplitter.js"
import { DayTimeColsSlicer } from "../DayTimeColsSlicer.js"
import { splitInteractionByCol, splitSegsByCol } from "../TimeColsSeg.js"
import { TimeGridWeekNumberCell } from "./TimeGridWeekNumberCell.js"
import { TimeGridLayout } from './TimeGridLayout.js'
import { createDayHeaderFormatter } from '@fullcalendar/daygrid/internal'

export class TimeGridView extends DateComponent<ViewProps> {
  createDayHeaderFormatter = memoize(createDayHeaderFormatter)

  private buildTimeColsModel = memoize(buildTimeColsModel)
  private buildDayRanges = memoize(buildDayRanges)
  private splitFgEventSegs = memoize(splitSegsByCol)
  private splitBgEventSegs = memoize(splitSegsByCol)
  private splitBusinessHourSegs = memoize(splitSegsByCol)
  private splitNowIndicatorSegs = memoize(splitSegsByCol)
  private splitDateSelectionSegs = memoize(splitSegsByCol)
  private splitEventDrag = memoize(splitInteractionByCol)
  private splitEventResize = memoize(splitInteractionByCol)

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
    let dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      true, // datesRepDistinctDays
      dayTableModel.cells.length,
    )

    return (
      <NowTimer unit={options.nowIndicator ? 'minute' : 'day' /* hacky */}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const colCnt = dayTableModel.cells[0].length
          const fgEventSegsByCol = this.splitFgEventSegs(timedProps.fgEventSegs, colCnt)
          const bgEventSegsByCol = this.splitBgEventSegs(timedProps.bgEventSegs, colCnt)
          const businessHourSegsByCol = this.splitBusinessHourSegs(timedProps.businessHourSegs, colCnt)
          const nowIndicatorSegsByCol = this.splitNowIndicatorSegs(options.nowIndicator && this.dayTimeColsSlicer.sliceNowDate(nowDate, dateProfile, options.nextDayThreshold, context, dayRanges), colCnt)
          const dateSelectionSegsByCol = this.splitDateSelectionSegs(timedProps.dateSelectionSegs, colCnt)
          const eventDragByCol = this.splitEventDrag(timedProps.eventDrag, colCnt)
          const eventResizeByCol = this.splitEventResize(timedProps.eventResize, colCnt)

          return (
            <TimeGridLayout
              dateProfile={dateProfile}
              nowDate={nowDate}
              todayRange={todayRange}
              cells={dayTableModel.cells[0]}
              forPrint={props.forPrint}

              // header content
              headerTiers={[dayTableModel.cells[0]]}
              // TODO: rethink having cell care about received-height
              renderHeaderLabel={(tierNum, innerWidthRef, innerHeightRef, width, height) => (
                options.weekNumbers ? (
                  <TimeGridWeekNumberCell
                    dateProfile={dateProfile}
                    innerWidthRef={innerWidthRef}
                    innerHeightRef={innerHeightRef}
                    width={width}
                    height={height}
                  />
                ) : (
                  <div>{/* empty... best? */}</div>
                )
              )}
              // TODO: rethink having cell care about received-height
              renderHeaderContent={(cell, tierNum, innerHeightRef, height) => (
                <DateHeaderCell
                  {...cell}
                  key={cell.key}
                  navLink={dayTableModel.cells.length > 1}
                  dateProfile={dateProfile}
                  todayRange={todayRange}
                  dayHeaderFormat={dayHeaderFormat}
                  colWidth={undefined}
                  innerHeightRef={innerHeightRef}
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
