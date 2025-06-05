import { DateComponent, DateMarker, DateRange, EventRangeProps, memoize, NowTimer, ViewProps } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { buildDateRowConfigs, createDayHeaderFormatter, DayTableSlicer } from '@fullcalendar/daygrid/internal'
import { AllDaySplitter } from "../AllDaySplitter.js"
import { DayTimeColsSlicer } from "../DayTimeColsSlicer.js"
import { organizeSegsByCol, splitInteractionByCol, TimeGridRange } from "../TimeColsSeg.js"
import { TimeGridLayout } from './TimeGridLayout.js'
import { buildDayRanges, buildTimeColsModel } from "./util.js"

export class TimeGridView extends DateComponent<ViewProps> {
  // memo
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)
  private buildTimeColsModel = memoize(buildTimeColsModel)
  private buildDayRanges = memoize(buildDayRanges)
  private buildDateRowConfigs = memoize(buildDateRowConfigs)
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

    const dayTableModel = this.buildTimeColsModel(dateProfile, dateProfileGenerator, context.dateEnv)
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

          const headerTiers = this.buildDateRowConfigs(
            dayTableModel.headerDates,
            true, // datesRepDistinctDays
            props.dateProfile,
            todayRange,
            dayHeaderFormat,
            context,
          )

          return (
            <TimeGridLayout
              labelId={props.labelId}
              labelStr={props.labelStr}

              dateProfile={dateProfile}
              nowDate={nowDate}
              todayRange={todayRange}
              cells={dayTableModel.cellRows[0]}
              forPrint={props.forPrint}
              className={props.className}

              // header content
              headerTiers={headerTiers}

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

              borderlessX={props.borderlessX}
              borderlessTop={props.borderlessTop}
              borderlessBottom={props.borderlessBottom}
            />
          )
        }}
      </NowTimer>
    )
  }
}
