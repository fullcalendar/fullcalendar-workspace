import {
  DateComponent,
  DateProfile,
  DateRange,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  NewScroller,
  NewScrollerInterface,
  getStickyHeaderDates,
  getIsHeightAuto,
} from '@fullcalendar/core/internal'
import { ComponentChild, Fragment, Ref, createElement } from '@fullcalendar/core/preact'
import { DayGridRows } from './DayGridRows.js'
import { TableSeg } from '../TableSeg.js'

export interface DayGridLayoutNormalProps<HeaderCellModel, HeaderCellKey> {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: HeaderCellModel[][]
  renderHeaderContent: (model: HeaderCellModel, tier: number) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey

  // body content
  fgEventSegs: TableSeg[]
  bgEventSegs: TableSeg[]
  businessHourSegs: TableSeg[]
  dateSelectionSegs: TableSeg[]
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  eventSelection: string

  // refs
  scrollerRef?: Ref<NewScrollerInterface>
  rowHeightsRef?: Ref<{ [key: string]: number }>
}

interface DayGridViewState {
  width?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
}

export class DayGridLayoutNormal<HeaderCellModel, HeaderCellKey> extends DateComponent<DayGridLayoutNormalProps<HeaderCellModel, HeaderCellKey>, DayGridViewState> {
  render() {
    const { props, state, context } = this
    const { options } = context

    const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    return (
      <Fragment>
        {options.dayHeaders && (
          <div
            className={[
              'fc-newnew-header',
              stickyHeaderDates && 'fc-newnew-sticky',
            ].join(' ')}
            style={{
              paddingLeft: state.leftScrollbarWidth,
              paddingRight: state.rightScrollbarWidth,
            }}
          >
            {props.headerTiers.map((cells, tierNum) => (
              <div key={tierNum} class='fc-newnew-row'>
                {cells.map((cell) => (
                  <Fragment key={props.getHeaderModelKey(cell)}>
                    {props.renderHeaderContent(cell, tierNum)}
                  </Fragment>
                ))}
              </div>
            ))}
          </div>
        )}
        <NewScroller
          vertical={verticalScrollbars}
          onWidth={this.handleWidth}
          ref={props.scrollerRef}
        >
          <DayGridRows
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={props.cellRows}
            forPrint={props.forPrint}
            isHitComboAllowed={props.isHitComboAllowed}

            // content
            fgEventSegs={props.fgEventSegs}
            bgEventSegs={props.bgEventSegs}
            businessHourSegs={props.businessHourSegs}
            dateSelectionSegs={props.dateSelectionSegs}
            eventSelection={props.eventSelection}
            eventDrag={props.eventDrag}
            eventResize={props.eventResize}

            // dimensions
            width={state.width}

            // refs
            rowHeightsRef={props.rowHeightsRef}
          />
        </NewScroller>
      </Fragment>
    )
  }

  handleWidth = (width: number) => {
    this.setState({ width })
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
  }
}
