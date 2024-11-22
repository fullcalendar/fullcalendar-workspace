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
}

interface DayGridViewState {
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
}

export class DayGridLayoutNormal extends BaseComponent<DayGridLayoutNormalProps, DayGridViewState> {
  render() {
    const { props, state, context } = this
    const { options } = context

    const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    return (
      <Fragment>
        {options.dayHeaders && (
          <DayGridHeader
            headerTiers={props.headerTiers}
            className={joinClassNames(
              'fc-daygrid-header fc-border-b',
              stickyHeaderDates && 'fc-table-header-sticky',
            )}
            paddingLeft={state.leftScrollbarWidth}
            paddingRight={state.rightScrollbarWidth}
          />
        )}
        <Scroller
          vertical={verticalScrollbars}
          leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
          rightScrollbarWidthRef={this.handleRightScrollbarWidth}
          className={joinClassNames(
            'fc-daygrid-body fc-flex-col fc-print-block',
            verticalScrollbars && 'fc-liquid',
          )}
          ref={this.handleScroller}
        >
          <DayGridRows
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={props.cellRows}
            forPrint={props.forPrint}
            isHitComboAllowed={props.isHitComboAllowed}
            className='fc-grow'

            // content
            fgEventSegs={props.fgEventSegs}
            bgEventSegs={props.bgEventSegs}
            businessHourSegs={props.businessHourSegs}
            dateSelectionSegs={props.dateSelectionSegs}
            eventDrag={props.eventDrag}
            eventResize={props.eventResize}
            eventSelection={props.eventSelection}

            // refs
            rowHeightRefMap={props.rowHeightRefMap}
          />
        </Scroller>
      </Fragment>
    )
  }

  handleScroller = (scroller: Scroller) => {
    setRef(this.props.scrollerRef, scroller)
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
  }
}
