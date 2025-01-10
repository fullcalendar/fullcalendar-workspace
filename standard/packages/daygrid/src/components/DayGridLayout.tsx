import {
  afterSize,
  BaseComponent,
  DateMarker,
  DateProfile,
  DateRange,
  DayTableCell,
  DayGridRange,
  EventSegUiInteractionState,
  Hit,
  RefMap,
  Scroller,
  ViewContainer,
  EventRangeProps,
  joinClassNames
} from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { DayGridLayoutNormal } from './DayGridLayoutNormal.js'
import { DayGridLayoutPannable } from './DayGridLayoutPannable.js'
import { computeTopFromDate } from './util.js'
import { RowConfig } from '../header-tier.js'

export interface DayGridLayoutProps {
  labelId: string | undefined
  labelStr: string | undefined

  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className: string

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
}

export class DayGridLayout extends BaseComponent<DayGridLayoutProps> {
  // ref
  private scrollerRef = createRef<Scroller>()
  private rowHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.updateScrollY)
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
        attrs={{
          role: 'grid',
          'aria-rowcount': props.headerTiers.length + props.cellRows.length,
          'aria-colcount': props.cellRows[0].length,
          'aria-labelledby': props.labelId,
          'aria-label': props.labelStr,
        }}
        className={joinClassNames(props.className, 'fc-print-root fc-border')}
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
    this.resetScroll()
    this.scrollerRef.current.addScrollEndListener(this.handleScrollEnd)
  }

  componentDidUpdate(prevProps: DayGridLayoutProps) {
    if (prevProps.dateProfile !== this.props.dateProfile && this.context.options.scrollTimeReset) {
      this.resetScroll()
    }
  }

  componentWillUnmount() {
    this.scrollerRef.current.removeScrollEndListener(this.handleScrollEnd)
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  resetScroll() {
    this.scrollDate = this.props.dateProfile.currentDate
    this.updateScrollY()

    const scroller = this.scrollerRef.current
    scroller.scrollTo({ x: 0 })
  }

  updateScrollY = () => {
    const rowHeightMap = this.rowHeightRefMap.current
    const scroller = this.scrollerRef.current

    // Since updateScrollY is called by rowHeightRefMap, could be called with null during cleanup,
    // and the scroller might not exist
    if (scroller && this.scrollDate) {
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

  handleScrollEnd = (isUser: boolean) => {
    if (isUser) {
      this.scrollDate = null
    }
  }
}
