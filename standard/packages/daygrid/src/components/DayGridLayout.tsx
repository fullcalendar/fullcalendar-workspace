import {
  afterSize,
  BaseComponent,
  DateMarker,
  DateProfile,
  DateRange,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  RefMap,
  Scroller,
  ViewContainer
} from '@fullcalendar/core/internal'
import { ComponentChild, createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { TableSeg } from '../TableSeg.js'
import { DayGridLayoutNormal } from './DayGridLayoutNormal.js'
import { DayGridLayoutPannable } from './DayGridLayoutPannable.js'
import { computeTopFromDate } from './util.js'

export interface DayGridLayoutProps<HeaderCellModel, HeaderCellKey> {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className: string

  // header content
  headerTiers: HeaderCellModel[][]
  renderHeaderContent: (
    model: HeaderCellModel,
    tier: number,
    innerHeightRef: Ref<number> | undefined, // unused... why do we have it then???
    width: number | undefined, // TODO: rename to colWidth
  ) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey

  // body content
  fgEventSegs: TableSeg[]
  bgEventSegs: TableSeg[]
  businessHourSegs: TableSeg[]
  dateSelectionSegs: TableSeg[]
  eventDrag: EventSegUiInteractionState<TableSeg> | null
  eventResize: EventSegUiInteractionState<TableSeg> | null
  eventSelection: string
}

export class DayGridLayout<HeaderCellModel, HeaderCellKey> extends BaseComponent<DayGridLayoutProps<HeaderCellModel, HeaderCellKey>> {
  // ref
  private scrollerRef = createRef<Scroller>()
  private rowHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.updateScroll)
  })

  // internal
  private scrollDate: DateMarker | null = null

  render() {
    const { props, context } = this
    const { options } = context

    const commonLayoutProps = {
      ...props,
      scrollerRef: this.scrollerRef,
      rowHeightRefMap: this.rowHeightRefMap,
    }

    return (
      <ViewContainer
        viewSpec={context.viewSpec}
        elClasses={[props.className, 'fc-flex-column', 'fc-border']}
      >
        {options.dayMinWidth ? (
          <DayGridLayoutPannable {...commonLayoutProps} dayMinWidth={options.dayMinWidth} />
        ) : (
          <DayGridLayoutNormal {...commonLayoutProps} />
        )}
      </ViewContainer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.scrollDate = this.props.dateProfile.currentDate
    this.updateScroll()

    this.scrollerRef.current.addScrollEndListener(this.clearScroll)
  }

  componentDidUpdate(prevProps: DayGridLayoutProps<unknown, unknown>) {
    const { options } = this.context

    if (prevProps.dateProfile !== this.props.dateProfile && options.scrollTimeReset) {
      this.scrollDate = this.props.dateProfile.currentDate
    }
    this.updateScroll()
  }

  componentWillUnmount() {
    this.scrollerRef.current.removeScrollEndListener(this.clearScroll)
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  clearScroll = () => {
    this.scrollDate = null
  }

  updateScroll = () => {
    if (this.scrollDate) {
      const rowHeightMap = this.rowHeightRefMap.current
      const scroller = this.scrollerRef.current

      let scrollTop = computeTopFromDate(
        this.scrollDate,
        this.props.cellRows,
        rowHeightMap,
        1, // HACK to consider *outer* height to include border
      )

      if (scrollTop != null) {
        if (scrollTop) {
          scrollTop++ // clear top border
        }
        scroller.scrollTo({ y: scrollTop })
      }
    }
  }
}
