import {
  DateComponent,
  DateProfile,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  PositionCache,
  ScrollController2,
  ViewContainer
} from '@fullcalendar/core/internal'
import { ComponentChild, createElement, createRef } from '@fullcalendar/core/preact'
import { TableSeg } from '../TableSeg.js'
import { DayGridLayoutNormal } from './DayGridLayoutNormal.js'
import { DayGridLayoutPannable } from './DayGridLayoutPannable.js'
import { DayGridRowsProps } from './DayGridRows.js'

export interface DayGridLayoutProps<HeaderCellModel, HeaderCellKey> {
  dateProfile: DateProfile
  cellRows: DayTableCell[][]

  headerTiers: HeaderCellModel[][]
  renderHeaderContent: (model: HeaderCellModel, tier: number) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey

  businessHourSegs: TableSeg[]
  bgEventSegs: TableSeg[]
  fgEventSegs: TableSeg[]
  dateSelectionSegs: TableSeg[]
  eventSelection: string
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null

  forPrint: boolean
  isHeightAuto: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean // who uses this???
}

interface DayGridViewState {
  viewInnerWidth?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
}

export class DayGridLayout<HeaderCellModel, HeaderCellKey> extends DateComponent<DayGridLayoutProps<HeaderCellModel, HeaderCellKey>, DayGridViewState> {
  private scrollControllerRef = createRef<ScrollController2>()
  private rowPositionsRef = createRef<PositionCache>()

  render() {
    const { props, context } = this
    const { options } = context

    const dayGridRowsProps: DayGridRowsProps = {
      dateProfile: props.dateProfile,
      cells: props.cellRows,
      showWeekNumbers: options.weekNumbers,
      businessHourSegs: props.businessHourSegs,
      bgEventSegs: props.bgEventSegs,
      fgEventSegs: props.fgEventSegs,
      dateSelectionSegs: props.dateSelectionSegs,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize,
      dayMaxEvents: options.dayMaxEvents,
      dayMaxEventRows: options.dayMaxEventRows,
      forPrint: props.forPrint,
      isHitComboAllowed: props.isHitComboAllowed,
    }

    return (
      <ViewContainer elClasses={['fc-daygrid']} viewSpec={context.viewSpec}>
        <div className='fc-newnew-bordered'>
          {options.dayMinWidth ? (
            <DayGridLayoutPannable
              scrollControllerRef={this.scrollControllerRef}
              rowPositionsRef={this.rowPositionsRef}
              dateProfile={props.dateProfile}
              cellRows={props.cellRows}
              headerTiers={props.headerTiers}
              renderHeaderContent={props.renderHeaderContent}
              getHeaderModelKey={props.getHeaderModelKey}
              dayGridRowsProps={dayGridRowsProps}
              forPrint={props.forPrint}
              isHeightAuto={props.isHeightAuto}
              dayMinWidth={options.dayMinWidth}
            />
          ) : (
            <DayGridLayoutNormal
              scrollControllerRef={this.scrollControllerRef}
              rowPositionsRef={this.rowPositionsRef}
              dateProfile={props.dateProfile}
              cellRows={props.cellRows}
              headerTiers={props.headerTiers}
              renderHeaderContent={props.renderHeaderContent}
              getHeaderModelKey={props.getHeaderModelKey}
              dayGridRowsProps={dayGridRowsProps}
              forPrint={props.forPrint}
              isHeightAuto={props.isHeightAuto}
            />
          )}
        </div>
      </ViewContainer>
    )
  }

  /*
  TODO: hook up
  */
  handleScroll = () => {
    console.log(
      this.scrollControllerRef.current,
      this.rowPositionsRef.current,
    )
  }
}

// TODO: incorporate
// -------------------------------------------------------------------------------------------------

/*
CLASSNAME stuff:

  let { dayMaxEventRows, dayMaxEvents, expandRows } = props
  let limitViaBalanced = dayMaxEvents === true || dayMaxEventRows === true

  // if rows can't expand to fill fixed height, can't do balanced-height event limit
  // TODO: best place to normalize these options?
  if (limitViaBalanced && !expandRows) {
    limitViaBalanced = false
    dayMaxEventRows = null
    dayMaxEvents = null
  }

  let classNames = [
    'fc-daygrid-body', // necessary for TableRows DnD parent
    limitViaBalanced ? 'fc-daygrid-body-balanced' : 'fc-daygrid-body-unbalanced', // will all row heights be equal?
    expandRows ? '' : 'fc-daygrid-body-natural', // will height of one row depend on the others?
  ]

SCROLL METHODS (do this for other views too?):

  componentDidMount(): void {
    this.requestScrollReset()
  }

  componentDidUpdate(prevProps: TableProps): void {
    if (prevProps.dateProfile !== this.props.dateProfile) {
      this.requestScrollReset()
    } else {
      this.flushScrollReset()
    }
  }

  requestScrollReset() {
    this.needsScrollReset = true
    this.flushScrollReset()
  }

  flushScrollReset() {
    if (
      this.needsScrollReset &&
      this.props.clientWidth // sizes computed?
    ) {
      const subjectEl = getScrollSubjectEl(this.elRef.current, this.props.dateProfile)

      if (subjectEl) {
        const originEl = subjectEl.closest('.fc-daygrid-body')
        const scrollEl = originEl.closest('.fc-scroller')
        const scrollTop = subjectEl.getBoundingClientRect().top -
          originEl.getBoundingClientRect().top

        scrollEl.scrollTop = scrollTop ? (scrollTop + 1) : 0 // overcome border
      }

      this.needsScrollReset = false
    }
  }

// for dayGridYear/custom... to scroll to today's date...

function getScrollSubjectEl(containerEl: HTMLElement, dateProfile: DateProfile): HTMLElement | undefined {
  let el: HTMLElement

  if (dateProfile.currentRangeUnit.match(/year|month/)) {
    el = containerEl.querySelector(`[data-date="${formatIsoMonthStr(dateProfile.currentDate)}-01"]`)
    // even if view is month-based, first-of-month might be hidden...
  }

  if (!el) {
    el = containerEl.querySelector(`[data-date="${formatDayString(dateProfile.currentDate)}"]`)
    // could still be hidden if an interior-view hidden day
  }

  return el
}

*/
