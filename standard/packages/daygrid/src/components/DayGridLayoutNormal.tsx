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
  clientWidth?: number
  endScrollbarWidth?: number
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
          <div className={joinClassNames(
            props.forPrint ? 'fc-ps-header' : 'fc-flex-row', // col for print, row for screen
            'fc-border-b',
          )}>
            <DayGridHeader
              headerTiers={props.headerTiers}
              className={joinClassNames(
                'fc-daygrid-header',
                stickyHeaderDates && 'fc-table-header-sticky',
              )}
            />
            {Boolean(state.endScrollbarWidth) && (
              <div
                className='fc-border-s fc-filler'
                style={{ minWidth: state.endScrollbarWidth }}
              />
            )}
          </div>
        )}
        <Scroller
          vertical={verticalScrollbars}
          clientWidthRef={this.handleClientWidth}
          endScrollbarWidthRef={this.handleEndScrollbarWidth}
          className={joinClassNames(
            'fc-daygrid-body fc-ps-col',
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

            // dimensions
            visibleWidth={ // TODO: DRY
              state.clientWidth != null && state.endScrollbarWidth != null
                ? state.clientWidth + state.endScrollbarWidth
                : undefined
            }

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

  handleClientWidth = (clientWidth: number) => {
    this.setState({ clientWidth })
  }

  handleEndScrollbarWidth = (endScrollbarWidth: number) => {
    this.setState({ endScrollbarWidth })
  }
}
