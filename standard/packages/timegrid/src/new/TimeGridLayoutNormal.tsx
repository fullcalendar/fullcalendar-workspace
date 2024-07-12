import { BaseComponent, DateMarker, DayTableCell, NewScroller, RefMapKeyed, ScrollController2, getStickyHeaderDates } from "@fullcalendar/core/internal"
import { Fragment, createElement, createRef, ComponentChild, Ref } from '@fullcalendar/core/preact'
import { DayGridRowProps } from '@fullcalendar/daygrid/internal'
import { TimeGridAllDayLabelCell } from "./TimeGridAllDayLabelCell.js"
import { TimeGridAllDayContent } from "./TimeGridAllDayContent.js"
import { TimeGridNowIndicator } from "./TimeGridNowIndicator.js"
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridAxisCell } from "./TimeGridAxisCell.js"
import { TimeGridSlatCell } from "./TimeGridSlatCell.js"
import { TimeGridCols, TimeGridColsProps } from "./TimeGridCols.js"

export interface TimeGridLayoutNormalProps<HeaderCellModel, HeaderCellKey> {
  scrollControllerRef?: Ref<ScrollController2> // TODO: assign this!
  slatHeightRef?: Ref<number> // TODO: assign this!

  cells: DayTableCell[]
  nowDate: DateMarker

  headerTiers: HeaderCellModel[][]
  renderHeaderLabel: (tier: number, handleEl: (el: HTMLElement) => void, height: number) => ComponentChild
  renderHeaderContent: (model: HeaderCellModel, tier: number, handleEl: (el: HTMLElement) => void) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey

  dayGridRowProps: DayGridRowProps,
  timeGridColsProps: TimeGridColsProps,
  slatMetas: TimeSlatMeta[],
}

interface TimeGridLayoutState {
  axisWidth?: number
  slatHeight?: number
}
// TODO: scrollbar-width stuff

export class TimeGridLayoutNormal<HeaderCellModel, HeaderCellKey> extends BaseComponent<TimeGridLayoutNormalProps<HeaderCellModel, HeaderCellKey>, TimeGridLayoutState> {
  private headerLabelElRefMap = new RefMapKeyed<number, HTMLElement>()
  private allDayLabelElRef = createRef<HTMLElement>()
  private slatLabelElRefMap = new RefMapKeyed<string, HTMLElement>() // keyed by ISO-something
  private slatContentElRefMap = new RefMapKeyed<string, HTMLElement>() // keyed by ISO-something

  private bodyScroll = new ScrollController2()

  render() {
    const { props, state, context } = this
    const { nowDate } = props
    const { axisWidth } = state
    const { options } = context
    const stickyHeaderDates = getStickyHeaderDates(options)

    return (
      <Fragment>
        {options.dayHeaders && (
          <div className={[
            'fc-newnew-header',
            stickyHeaderDates && 'fc-newnew-sticky',
          ].join(' ')}>
            <div className='fc-newnew-header-inner'>
              {props.headerTiers.map((models, tierNum) => (
                <div className='fc-newnew-row'>
                  {props.renderHeaderLabel(
                    tierNum,
                    this.headerLabelElRefMap.createRef(tierNum),
                    undefined,
                  )}
                  {models.map((model) => (
                    props.renderHeaderContent(
                      model,
                      tierNum,
                      undefined, // ref
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {options.allDaySlot && (
          <Fragment>
            <div className='fc-newnew-row'>
              <div className='fc-newnew-col' style={{ width: axisWidth }}>
                <TimeGridAllDayLabelCell
                  elRef={this.allDayLabelElRef}
                />
              </div>
              <TimeGridAllDayContent {...props.dayGridRowProps} />
            </div>
            <div className='fc-newnew-divider'></div>
          </Fragment>
        )}
        <NewScroller vertical elRef={this.bodyScroll.handleEl}>
          <div className='fc-newnew-canvas'>
            <div>
              {props.slatMetas.map((slatMeta) => (
                <div className='fc-newnew-row'>
                  <div style={{ width: axisWidth }}>
                    <TimeGridAxisCell
                      {...slatMeta}
                      elRef={this.slatLabelElRefMap.createRef(slatMeta.key)}
                    />
                  </div>
                  <TimeGridSlatCell
                    slatMeta={slatMeta}
                    elRef={this.slatContentElRefMap.createRef(slatMeta.key)}
                  />
                </div>
              ))}
            </div>
            <div className='fc-newnew-absolute'>
              <div style={{ width: axisWidth }}>
                <TimeGridNowIndicator nowDate={nowDate} />
              </div>
              <TimeGridCols {...props.timeGridColsProps} />
            </div>
          </div>
        </NewScroller>
      </Fragment>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)
  }

  componentDidUpdate() {
    this.handleSizing()
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleSizing = () => {
    // axisWidth
    // ---------

    let maxAxisElWidth = 0
    let axisEls: HTMLElement[] = [
      ...this.headerLabelElRefMap.current.values(),
      this.allDayLabelElRef.current,
      ...this.slatLabelElRefMap.current.values(),
    ]

    for (let axisEl of axisEls) {
      maxAxisElWidth = Math.max(maxAxisElWidth, axisEl.offsetWidth)
    }

    this.setState({
      axisWidth: maxAxisElWidth
    })

    // slatHeight
    // ----------

    let maxSlatHeight = 0

    for (const slatEl of this.slatLabelElRefMap.current.values()) {
      maxSlatHeight = Math.max(maxSlatHeight, slatEl.offsetHeight)
    }
    for (const slatEl of this.slatContentElRefMap.current.values()) {
      maxSlatHeight = Math.max(maxSlatHeight, slatEl.offsetHeight)
    }

    this.setState({
      slatHeight: maxSlatHeight + 1, // add border
    })
  }
}
