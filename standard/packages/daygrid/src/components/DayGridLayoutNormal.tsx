import {
  BaseComponent,
  DateProfile,
  DateRange,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  Scroller,
  ScrollerInterface,
  getStickyHeaderDates,
  getIsHeightAuto,
  setRef,
  RefMap,
  DayGridRange,
  EventRangeProps,
  joinClassNames,
  Ruler,
  generateClassName,
  joinArrayishClassNames,
} from '@fullcalendar/core/internal'
import { Fragment, Ref, createElement } from '@fullcalendar/core/preact'
import { DayGridRows } from './DayGridRows.js'
import { DayGridHeader } from './DayGridHeader.js'
import { RowConfig } from '../header-tier.js'

export interface DayGridLayoutNormalProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: RowConfig<{ text: string, isDisabled: boolean }>[]

  // body content
  fgEventSegs: (DayGridRange & EventRangeProps)[]
  bgEventSegs: (DayGridRange & EventRangeProps)[]
  businessHourSegs: (DayGridRange & EventRangeProps)[]
  dateSelectionSegs: (DayGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<DayGridRange> | null
  eventResize: EventSegUiInteractionState<DayGridRange> | null
  eventSelection: string

  // refs
  scrollerRef?: Ref<ScrollerInterface>
  rowHeightRefMap?: RefMap<string, number>

  borderX: boolean
}

interface DayGridViewState {
  totalWidth?: number
  clientWidth?: number
}

export class DayGridLayoutNormal extends BaseComponent<DayGridLayoutNormalProps, DayGridViewState> {
  render() {
    const { props, state, context } = this
    const { options } = context

    const { totalWidth, clientWidth } = state

    const endScrollbarWidth = (totalWidth != null && clientWidth != null)
      ? totalWidth - clientWidth
      : undefined

    const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    return (
      <Fragment>
        {options.dayHeaders && (
          <div className={joinClassNames(
            props.forPrint ? 'fc-print-header' : 'fc-flex-row', // col for print, row for screen
            stickyHeaderDates && 'fc-table-header-sticky',
            'fc-border-b',
            generateClassName(options.viewHeaderClassNames, {
              borderX: props.borderX,
              isSticky: stickyHeaderDates,
            }),
          )}>
            <DayGridHeader
              headerTiers={props.headerTiers}
              className='fc-daygrid-header'
            />
            {Boolean(endScrollbarWidth) && (
              <div
                className={joinArrayishClassNames(
                  'fc-border-s fc-filler',
                  options.fillerClassNames,
                  options.fillerXClassNames,
                )}
                style={{ minWidth: endScrollbarWidth }}
              />
            )}
          </div>
        )}
        <Scroller
          vertical={verticalScrollbars}
          className={joinClassNames(
            'fc-daygrid-body',
            // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
            // https://stackoverflow.com/a/60256345
            !props.forPrint && 'fc-flex-col',
            verticalScrollbars && 'fc-liquid',
            generateClassName(options.viewBodyClassNames, {
              borderX: props.borderX,
            }),
          )}
          ref={this.handleScroller}
          clientWidthRef={this.handleClientWidth}
        >
          <DayGridRows
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={props.cellRows}
            forPrint={props.forPrint}
            isHitComboAllowed={props.isHitComboAllowed}
            className='fc-grow'
            dayMaxEvents={props.forPrint ? undefined : options.dayMaxEvents}
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

            // refs
            rowHeightRefMap={props.rowHeightRefMap}
          />
        </Scroller>
        <Ruler widthRef={this.handleTotalWidth} />
      </Fragment>
    )
  }

  private handleScroller = (scroller: Scroller | null) => {
    setRef(this.props.scrollerRef, scroller)
  }

  private handleTotalWidth = (totalWidth: number) => {
    this.setState({ totalWidth })
  }

  private handleClientWidth = (clientWidth: number) => {
    this.setState({ clientWidth })
  }
}
