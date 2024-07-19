import { DateComponent, ViewProps, memoize, DateMarker, NowTimer, DateRange, DayTableModel, DateProfile, DateEnv } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { DateHeaderCell, DayTableSlicer } from '@fullcalendar/daygrid/internal'
import { buildTimeColsModel } from "../old/DayTimeColsView.js"
import { AllDaySplitter } from "../AllDaySplitter.js"
import { DayTimeColsSlicer } from "../DayTimeColsSlicer.js"
import { splitInteractionByCol, splitSegsByCol } from "../TimeColsSeg.js"
import { TimeGridWeekNumberCell } from "./TimeGridWeekNumberCell.js"
import { TimeGridLayout } from './TimeGridLayout.js'
import { createDayHeaderFormatter } from '../../../daygrid/src/new/util.js' // ahhhh

export class TimeGridView extends DateComponent<ViewProps> {
  createDayHeaderFormatter = memoize(createDayHeaderFormatter) // TODO: better place

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

              eventSelection={props.eventSelection}

              // header content
              headerTiers={[dayTableModel.cells[0]]}
              renderHeaderLabel={(tierNum, handleEl, height) => (
                options.weekNumbers ? (
                  <TimeGridWeekNumberCell dateProfile={dateProfile} elRef={handleEl} />
                ) : (
                  <div>{/* empty... best? */}</div>
                )
              )}
              renderHeaderContent={(cell, tierNum, handleEl) => (
                <DateHeaderCell
                  elRef={handleEl}
                  cell={cell}
                  navLink={dayTableModel.cells.length > 1}
                  dateProfile={dateProfile}
                  todayRange={todayRange}
                  dayHeaderFormat={dayHeaderFormat}
                  colWidth={undefined}
                />
              )}
              getHeaderModelKey={(cell) => cell.date.toISOString()}

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
            />
          )
        }}
      </NowTimer>
    )
  }
}

export function buildDayRanges(dayTableModel: DayTableModel, dateProfile: DateProfile, dateEnv: DateEnv): DateRange[] {
  let ranges: DateRange[] = []

  for (let date of dayTableModel.headerDates) {
    ranges.push({
      start: dateEnv.add(date, dateProfile.slotMinTime),
      end: dateEnv.add(date, dateProfile.slotMaxTime),
    })
  }

  return ranges
}
