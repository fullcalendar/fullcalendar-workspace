import { BaseComponent } from '../../vdom-util'
import { useMemo } from 'react'
import { ViewProps } from '../../component-util/View'
import { useViewContext } from '../../hooks/useViewContext'
import { PLAIN_KEYING, DAY_GRID_LANE } from '../../common/day-table/keying'
import { useDayTableSegs } from '../../common/day-table/useDayTableSegs'
import { DayGridRange } from '../DayTableModel'
import { buildDateRowConfigs } from '../header-tier'
import { DayGridLayout } from './DayGridLayout'
import { useDayGridViewData, useDayHeaderFormatter } from './useDayGridViewData'

// a class, because a view's component must be one (see parseViewConfig)
export class DayGridView extends BaseComponent<ViewProps> {
  // reads no context, so an inherited contextType would only re-render it on every context change
  static contextType = null

  render() {
    return <DayGridViewBody {...this.props} />
  }
}

function DayGridViewBody(props: ViewProps) {
  const context = useViewContext()
  const { options } = context
  const { dateProfile } = props
  const { dayTableModel, datesRepDistinctDays, todayRange } = useDayGridViewData(dateProfile)
  const dayHeaderFormat = useDayHeaderFormatter(datesRepDistinctDays, dayTableModel.colCount)
  const slicedProps = useDayTableSegs<DayGridRange>(
    props,
    PLAIN_KEYING,
    dayTableModel,
    DAY_GRID_LANE,
    dateProfile,
    options.nextDayThreshold,
    context,
  )
  const headerTiers = useMemo(
    () => buildDateRowConfigs(
      dayTableModel.headerDates,
      datesRepDistinctDays,
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
    ),
    [dayTableModel.headerDates, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, context],
  )

  return (
    <DayGridLayout
      labelId={props.labelId}
      labelStr={props.labelStr}
      dateProfile={dateProfile}
      todayRange={todayRange}
      cellRows={dayTableModel.cellRows}
      forPrint={props.forPrint}
      className={props.className}

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
}
