import { BaseComponent, DateMarker, DayTableCell, NewScroller, RefMapKeyed, ScrollController2, ScrollJoinerInterface, getStickyHeaderDates } from "@fullcalendar/core/internal"
import { Fragment, createElement, createRef, ComponentChild, Ref } from '@fullcalendar/core/preact'
import { DayGridRowProps } from '@fullcalendar/daygrid/internal'
import { TimeGridAllDayLabelCell } from "./TimeGridAllDayLabelCell.js"
import { TimeGridAllDayContent } from "./TimeGridAllDayContent.js"
import { TimeGridNowIndicator } from "./TimeGridNowIndicator.js"
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridAxisCell } from "./TimeGridAxisCell.js"
import { TimeGridSlatCell } from "./TimeGridSlatCell.js"
import { TimeGridCols, TimeGridColsProps } from "./TimeGridCols.js"

export interface TimeGridLayoutPannableProps<HeaderCellModel, HeaderCellKey> {
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

  isHeightAuto: boolean
  dayMinWidth: number
}

interface TimeGridLayoutPannableState {
  axisWidth?: number
  headerTierHeights?: number[]
  allDayHeight?: number
  slatHeight?: number
}
// TODO: scrollbar-width stuff

export class TimeGridLayoutPannable<HeaderCellModel, HeaderCellKey> extends BaseComponent<TimeGridLayoutPannableProps<HeaderCellModel, HeaderCellKey>, TimeGridLayoutPannableState> {
  private headerLabelElRefMap = new RefMapKeyed<number, HTMLElement>()
  private headerContentElRefMaps: RefMapKeyed<HeaderCellKey, HTMLElement>[] = []
  private allDayLabelElRef = createRef<HTMLElement>()
  private allDayContentElRefMap = new RefMapKeyed<string, HTMLElement>()
  private slatLabelElRefMap = new RefMapKeyed<string, HTMLElement>() // keyed by ISO-something
  private slatContentElRefMap = new RefMapKeyed<string, HTMLElement>() // keyed by ISO-something

  // yes h-scroll
  private axisScroll = new ScrollController2()
  private mainScroll = new ScrollController2()
  private headScroll = new ScrollController2()
  private footScroll = new ScrollController2()
  private allDayScroll = new ScrollController2()

  // TODO: define via plugin system somehow
  private hScrollJoiner: ScrollJoinerInterface // axisScroll+mainScroll
  private vScrollJoiner: ScrollJoinerInterface // headScroll+allDayScroll+mainScroll+footScroll

  render() {
    const { props, state, context } = this
    const { nowDate } = props
    const { axisWidth } = state
    const { options } = context

    const { headerContentElRefMaps } = this
    for (let i = headerContentElRefMaps.length; i < props.headerTiers.length; i++) {
      headerContentElRefMaps.push(new RefMapKeyed())
    }
    // TODO: kill headerContentElRefMaps rows that are no longer used

    const stickyHeaderDates = getStickyHeaderDates(options)
    const stickyFooterScrollbar = props.isHeightAuto && options.stickyFooterScrollbar !== false

    // TODO: use dayMinWidth somehow

    return (
      <Fragment>
        {options.dayHeaders && (
          <div className={[
            'fc-newnew-header',
            stickyHeaderDates && 'fc-newnew-sticky',
          ].join(' ')}>
            {/* LEFT */}
            <div className='fc-newnew-axis' style={{ width: axisWidth }}>
              {props.headerTiers.map((models, tierNum) => (
                props.renderHeaderLabel(
                  tierNum,
                  this.headerLabelElRefMap.createRef(tierNum),
                  state.headerTierHeights[tierNum],
                )
              ))}
            </div>
            {/* RIGHT */}
            <NewScroller horizontal elRef={this.headScroll.handleEl}>
              <div className='fc-newnew-canvas'>
                {props.headerTiers.map((models, tierNum) => (
                  <div className='fc-newnew-tier' style={{ height: state.headerTierHeights[tierNum] }}>
                    {models.map((model) => (
                      props.renderHeaderContent(
                        model,
                        tierNum,
                        headerContentElRefMaps[tierNum].createRef(
                          props.getHeaderModelKey(model),
                        ),
                      )
                    ))}
                  </div>
                ))}
              </div>
            </NewScroller>
          </div>
        )}
        {options.allDaySlot && (
          <Fragment>
            <div>
              {/* LEFT */}
              <TimeGridAllDayLabelCell
                elRef={this.allDayLabelElRef}
                width={axisWidth}
                height={state.allDayHeight}
              />
              {/* RIGHT */}
              <NewScroller horizontal elRef={this.allDayScroll.handleEl}>
                <TimeGridAllDayContent
                  {...props.dayGridRowProps}
                  cellRefMap={this.allDayContentElRefMap}
                  height={state.allDayHeight}
                />
              </NewScroller>
            </div>
            <div className='fc-newnew-divider'></div>
          </Fragment>
        )}
        <div>
          {/* LEFT */}
          <NewScroller vertical elStyle={{ width: axisWidth }} elRef={this.axisScroll.handleEl}>
            <div className='fc-newnew-canvas'>
              <div>
                <TimeGridNowIndicator nowDate={nowDate} />
              </div>
              {props.slatMetas.map((slatMeta) => (
                <div
                  key={slatMeta.key}
                  className='fc-newnew-row'
                  style={{
                    // TODO: move to cell?
                    height: state.slatHeight
                  }}
                >
                  <TimeGridAxisCell
                    {...slatMeta}
                    elRef={this.slatLabelElRefMap.createRef(slatMeta.key)}
                  />
                </div>
              ))}
            </div>
          </NewScroller>
          {/* RIGHT */}
          <NewScroller vertical horizontal elRef={this.mainScroll.handleEl}>
            <div className='fc-newnew-canvas'>
              <div>
                {props.slatMetas.map((slatMeta) => (
                  <div
                    key={slatMeta.key}
                    className='fc-newnew-row'
                    style={{
                      // TODO: move to cell?
                      height: state.slatHeight
                    }}
                  >
                    <TimeGridSlatCell
                      slatMeta={slatMeta}
                      elRef={this.slatContentElRefMap.createRef(slatMeta.key)}
                    />
                  </div>
                ))}
              </div>
              <div className='fc-newnew-absolute'>
                <TimeGridCols {...props.timeGridColsProps} />
              </div>
            </div>
          </NewScroller>
        </div>
        {stickyFooterScrollbar && (
          <div>
            {/* LEFT */}
            <div style={{ width: axisWidth }}></div>
            {/* RIGHT */}
            <NewScroller elRef={this.footScroll.handleEl}>
              <div
                className='fc-newnew-canvas'
                style={{ width: undefined }}
              />
            </NewScroller>
          </div>
        )}
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
    console.log(
      this.hScrollJoiner,
      this.vScrollJoiner,
    )

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

    // headerTierHeights
    // -----------------

    let headerTierLength = this.props.headerTiers.length
    let headerTierHeights = []

    for (let i = 0; i < headerTierLength; i++) {
      let headerLabelEl = this.headerLabelElRefMap.current.get(i)
      let headerContentElRefMap = this.headerContentElRefMaps[i]

      let headerEls: HTMLElement[] = [
        headerLabelEl,
        ...headerContentElRefMap.current.values(),
      ]

      let maxHeaderHeight = 0

      for (let headerEl of headerEls) {
        maxHeaderHeight = Math.max(maxHeaderHeight, headerEl.offsetHeight)
      }

      headerTierHeights.push(maxHeaderHeight)
    }

    this.setState({
      headerTierHeights,
    })

    // allDayHeight
    // ------------

    let maxAllDayHeight = 0
    let allDayEls: HTMLElement[] = [
      this.allDayLabelElRef.current,
      ...this.headerLabelElRefMap.current.values(),
    ]

    for (let allDayEl of allDayEls) {
      maxAllDayHeight = Math.max(maxAllDayHeight, allDayEl.offsetHeight)
    }

    this.setState({
      allDayHeight: maxAllDayHeight,
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
