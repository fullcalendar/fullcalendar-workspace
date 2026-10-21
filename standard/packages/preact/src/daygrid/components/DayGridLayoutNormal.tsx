import { joinClassNames } from '../../util/html'
import { DateProfile } from '../../date-profile/DateProfileGenerator'
import { DateRange } from '@full-ui/headless-calendar'
import { DayTableCell, DayGridRange } from '../../day-table/day-grid-range'
import { EventSegUiInteractionState } from '../../interactions/event-interaction-state'
import { Hit } from '../../interactions/hit'
import { Scroller } from '../../scrollgrid/Scroller'
import { ScrollerInterface } from '../../scrollgrid/scroller-types'
import { getTableHeaderSticky, getIsHeightAuto } from '../../scrollgrid/util'
import { RefMap } from '../../util/RefMap'
import { EventRangeProps } from '../../event-segs/event-ranges'
import { generateClassName } from '../../render-hook/render-hook-types'
import { useViewOptions } from '../../context/useGranularContexts'
import { memo, type Ref } from 'react'
import { DayGridRows } from './DayGridRows'
import { DayGridHeader } from './DayGridHeader'
import { RowConfig } from '../header-tier'
import classNames from '../../styles.module.css'
import { computeViewBorderless } from '../../util/misc'

export interface DayGridLayoutNormalProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: RowConfig<any, { text: string, isDisabled: boolean }>[]

  // body content
  fgEventSegs: (DayGridRange & EventRangeProps)[]
  bgEventSegs: (DayGridRange & EventRangeProps)[]
  businessHourSegs: (DayGridRange & EventRangeProps)[]
  dateSelectionSegs: (DayGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<DayGridRange> | null
  eventResize: EventSegUiInteractionState<DayGridRange> | null
  eventSelection: string

  // dimensions, measured by DayGridLayout (see DayGridColumns)
  totalWidth: number | undefined
  clientWidth: number | undefined
  cellIsNarrow: boolean
  cellIsMicro: boolean

  // refs
  clientWidthRef: Ref<number>
  scrollerRef: Ref<ScrollerInterface>
  rowHeightRefMap: RefMap<string, number>
}

export const DayGridLayoutNormal = memo(function DayGridLayoutNormal(props: DayGridLayoutNormalProps) {
  const options = useViewOptions()
  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)
  const { totalWidth, clientWidth } = props
  const { cellIsNarrow, cellIsMicro } = props

  let endScrollbarWidth = (totalWidth != null && clientWidth != null)
    ? totalWidth - clientWidth
    : undefined

  // HACK when clientWidth does NOT include body-border, compared to totalWidth
  if (endScrollbarWidth < 3) {
    endScrollbarWidth = 0
  }

  const verticalScrollbars = !getIsHeightAuto(options)
  const tableHeaderSticky = getTableHeaderSticky(options)

  return (
    <>
      {options.dayHeaders && (
        <div className={joinClassNames(
          generateClassName(options.tableHeaderClass, {
            isSticky: tableHeaderSticky,
            borderlessX,
            borderlessTop,
            borderlessBottom,
            multiMonthColumns: 0,
          }),
          classNames.flexCol,
          tableHeaderSticky && classNames.tableHeaderSticky,
        )}>
          <div className={classNames.flexRow}>
            <DayGridHeader
              headerTiers={props.headerTiers}
              cellIsNarrow={cellIsNarrow}
              cellIsMicro={cellIsMicro}
            />
            {Boolean(endScrollbarWidth) && (
              <div
                className={joinClassNames(
                  generateClassName(options.fillerClass, { inTableHeader: true }),
                  classNames.borderlessY,
                  classNames.borderlessEnd,
                )}
                style={{ minWidth: endScrollbarWidth }}
              />
            )}
          </div>
          <div
            className={generateClassName(options.dayHeaderDividerClass, {
              isSticky: tableHeaderSticky,
              multiMonthColumns: 0,
              options: { allDaySlot: Boolean(options.allDaySlot) },
            })}
          />
        </div>
      )}
      <Scroller
        vertical={verticalScrollbars}
        className={joinClassNames(
          generateClassName(options.tableBodyClass, {
            borderlessX,
            borderlessTop,
            borderlessBottom,
            multiMonthColumns: 0,
          }),
          // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
          // https://stackoverflow.com/a/60256345
          classNames.flexCol,
          verticalScrollbars && classNames.liquid,
        )}
        ref={props.scrollerRef as Ref<Scroller>}
        clientWidthRef={props.clientWidthRef}
      >
        <DayGridRows
          dateProfile={props.dateProfile}
          todayRange={props.todayRange}
          cellRows={props.cellRows}
          forPrint={false}
          isHitComboAllowed={props.isHitComboAllowed}
          className={classNames.grow}
          dayMaxEvents={options.dayMaxEvents}
          dayMaxEventRows={options.dayMaxEventRows}

          // content
          fgEventSegs={props.fgEventSegs}
          bgEventSegs={props.bgEventSegs}
          businessHourSegs={props.businessHourSegs}
          dateSelectionSegs={props.dateSelectionSegs}
          eventDrag={props.eventDrag}
          eventResize={props.eventResize}
          eventSelection={props.eventSelection}

          // dimensions
          visibleWidth={totalWidth}
          cellIsNarrow={cellIsNarrow}
          cellIsMicro={cellIsMicro}

          // refs
          rowHeightRefMap={props.rowHeightRefMap}
        />
      </Scroller>
    </>
  )
})
