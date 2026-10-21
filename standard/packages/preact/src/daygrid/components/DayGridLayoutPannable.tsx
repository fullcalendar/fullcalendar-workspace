import { joinClassNames } from '../../util/html'
import { DateProfile } from '../../DateProfileGenerator'
import { DateRange } from '@full-ui/headless-calendar'
import { DayTableCell, DayGridRange } from '../DayTableModel'
import { EventSegUiInteractionState } from '../../interactions/event-interaction-state'
import { Hit } from '../../interactions/hit'
import { Scroller } from '../../scrollgrid/Scroller'
import { ScrollerInterface } from '../../scrollgrid/ScrollerInterface'
import { getFooterScrollbarSticky, getTableHeaderSticky, getIsHeightAuto } from '../../scrollgrid/util'
import { RefMap } from '../../util/RefMap'
import { EventRangeProps } from '../../component-util/event-rendering'
import { FooterScrollbar } from '../../common/FooterScrollbar'
import { generateClassName } from '../../common/render-hook'
import { useViewOptions } from '../../hooks/useGranularContexts'
import { useScrollerSyncer } from '../../hooks/useScrollerSyncer'
import { memo, useRef, useState, type Ref } from 'react'
import { setRef } from '../../vdom-util'
import { DayGridRows } from './DayGridRows'
import { DayGridHeader } from './DayGridHeader'
import { RowConfig } from '../header-tier'
import classNames from '../../styles.module.css'
import { computeViewBorderless } from '../../util/misc'

export interface DayGridLayoutPannableProps {
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
  canvasWidth: number | undefined
  appliedColWidth: number | undefined
  cellIsNarrow: boolean
  cellIsMicro: boolean

  // refs
  clientWidthRef: Ref<number>
  scrollerRef: Ref<ScrollerInterface> // gets the body scroller, the only one that scrolls vertically
  xScrollerRef: Ref<ScrollerInterface> // gets the syncer of the header, body and footer scrollers
  rowHeightRefMap: RefMap<string, number>
}

export const DayGridLayoutPannable = memo(function DayGridLayoutPannable(props: DayGridLayoutPannableProps) {
  const options = useViewOptions()
  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)
  const { totalWidth, clientWidth, canvasWidth, appliedColWidth, cellIsNarrow, cellIsMicro } = props

  const headerScrollerRef = useRef<Scroller | null>(null)
  const bodyScrollerRef = useRef<Scroller | null>(null)
  const footerScrollerRef = useRef<Scroller | null>(null)
  useScrollerSyncer(
    /* isHorizontal = */ true,
    [headerScrollerRef, bodyScrollerRef, footerScrollerRef],
    props.xScrollerRef,
  )
  const scrollerRefRef = useRef(props.scrollerRef) // assigned during render, for the ref callback
  scrollerRefRef.current = props.scrollerRef
  const [handleBodyScroller] = useState(() => (scroller: Scroller | null) => {
    bodyScrollerRef.current = scroller
    setRef(scrollerRefRef.current, scroller)
  })

  const endScrollbarWidth = (totalWidth != null && clientWidth != null)
    ? totalWidth - clientWidth
    : undefined

  const verticalScrollbars = !getIsHeightAuto(options)
  const tableHeaderSticky = getTableHeaderSticky(options)
  const footerScrollbarSticky = getFooterScrollbarSticky(options)

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
          <Scroller
            horizontal
            hideScrollbars
            className={classNames.flexRow}
            ref={headerScrollerRef}
          >
            <DayGridHeader
              headerTiers={props.headerTiers}
              colWidth={appliedColWidth}
              viewportWidth={clientWidth}
              width={canvasWidth}
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
          </Scroller>
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
        horizontal
        hideScrollbars={footerScrollbarSticky}
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
        ref={handleBodyScroller}
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
          colWidth={appliedColWidth}
          width={canvasWidth}
          visibleWidth={totalWidth}
          cellIsNarrow={cellIsNarrow}
          cellIsMicro={cellIsMicro}

          // refs
          rowHeightRefMap={props.rowHeightRefMap}
        />
      </Scroller>

      {Boolean(footerScrollbarSticky) && (
        <FooterScrollbar
          isSticky
          canvasWidth={canvasWidth}
          scrollerRef={footerScrollerRef}
        />
      )}

    </>
  )
})
