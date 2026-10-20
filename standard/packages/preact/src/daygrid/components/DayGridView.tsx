import { BaseComponent } from '../../vdom-util'
import { useMemo, useState } from 'react'
import { ViewProps } from '../../component-util/View'
import { useViewContext } from '../../hooks/useViewContext'
import { DayTableSlicer } from '../DayTableSlicer'
import { buildDateRowConfigs } from '../header-tier'
import { DayGridLayout } from './DayGridLayout'
import { useDayGridViewData, useDayHeaderFormatter } from './useDayGridViewData'

// a class, because a view's component must be one (see parseViewConfig)
export class DayGridView extends BaseComponent<ViewProps> {
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
  const [slicer] = useState(() => new DayTableSlicer())
  const slicedProps = slicer.sliceProps(props, dateProfile, options.nextDayThreshold, context, dayTableModel)
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
