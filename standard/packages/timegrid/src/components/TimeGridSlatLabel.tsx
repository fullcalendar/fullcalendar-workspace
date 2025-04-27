import {
  Duration,
  SlotLabelContentArg
} from '@fullcalendar/core'
import {
  BaseComponent,
  ContentContainer,
  createFormatter,
  DateFormatter,
  DateMarker,
  generateClassName,
  getDateMeta,
  joinClassNames,
  memoize,
  setRef,
  ViewContext,
  watchSize
} from '@fullcalendar/core/internal'
import {
  createElement,
  createRef,
  Ref,
} from '@fullcalendar/core/preact'
import { TimeSlatMeta } from '../time-slat-meta.js'

const DEFAULT_SLAT_LABEL_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  omitZeroMinute: true,
  meridiem: 'short',
})

export interface TimeGridSlatLabelProps extends TimeSlatMeta {
  // dimensions
  width?: number
  isLiquid?: boolean // liquid *width* cell?
  borderTop: boolean

  // ref
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
}

export class TimeGridSlatLabel extends BaseComponent<TimeGridSlatLabelProps> {
  // memo
  private createRenderProps = memoize(createRenderProps)

  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerSize?: () => void

  render() {
    let { props, context } = this
    let { options } = context

    let labelFormat = // TODO: fully pre-parse
      options.slotLabelFormat == null ? DEFAULT_SLAT_LABEL_FORMAT :
        Array.isArray(options.slotLabelFormat) ? createFormatter(options.slotLabelFormat[0]) :
          createFormatter(options.slotLabelFormat)

    let renderProps = this.createRenderProps(props.date, props.time, !props.isLabeled, labelFormat, context)

    let className = joinClassNames(
      'fcu-tight',
      props.isLiquid ? 'fcu-liquid' : 'fcu-content-box',
      props.borderTop ? 'fcu-border-only-t' : 'fcu-border-none',
    )

    if (!props.isLabeled) {
      return (
        <div
          className={joinClassNames(
            className,
            generateClassName(options.slotLabelClassNames, renderProps),
          )}
          style={{ width: props.width }}
        />
      )
    }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          'data-time': props.isoTimeStr,
        }}
        className={className}
        style={{ width: props.width }}
        renderProps={renderProps}
        generatorName="slotLabelContent"
        customGenerator={options.slotLabelContent}
        defaultGenerator={renderInnerContent}
        classNameGenerator={options.slotLabelClassNames}
        didMount={options.slotLabelDidMount}
        willUnmount={options.slotLabelWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag="div"
            className={joinClassNames(
              'fcu-rigid',
              generateClassName(options.slotLabelInnerClassNames, renderProps),
            )}
            elRef={this.innerElRef}
          />
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const { props } = this
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    if (innerEl) { // could be null if !isLabeled
      // TODO: only attach this if refs props present
      // TODO: fire width/height independently?
      this.disconnectInnerSize = watchSize(innerEl, (width, height) => {
        setRef(props.innerWidthRef, width)
        setRef(props.innerHeightRef, height)
      })
    }
  }

  componentWillUnmount(): void {
    const { props } = this

    if (this.disconnectInnerSize) {
      this.disconnectInnerSize()
      setRef(props.innerWidthRef, null)
      setRef(props.innerHeightRef, null)
    }
  }
}

function createRenderProps(
  date: DateMarker,
  time: Duration,
  isMinor: boolean,
  labelFormat: DateFormatter,
  context: ViewContext,
): SlotLabelContentArg {
  return {
    // this is a time-specific slot. not day-specific, so don't do today/nowRange
    ...getDateMeta(date, context.dateEnv),

    level: 0, // axis level (for when multiple axes)
    text: context.dateEnv.format(date, labelFormat)[0],
    time: time,
    isMajor: false,
    isMinor,
    view: context.viewApi,
  }
}

function renderInnerContent(props) { // TODO: add types
  return props.text
}
