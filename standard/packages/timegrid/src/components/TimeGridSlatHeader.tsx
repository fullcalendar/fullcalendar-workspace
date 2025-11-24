import {
  Duration,
  SlotHeaderData
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
import classNames from '@fullcalendar/core/internal-classnames'
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

export interface TimeGridSlatHeaderProps extends TimeSlatMeta {
  // dimensions
  height?: number
  liquidHeight?: boolean
  borderTop: boolean
  isNarrow: boolean

  // ref
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
}

/*
Always oriented in a column
*/
export class TimeGridSlatHeader extends BaseComponent<TimeGridSlatHeaderProps> {
  // memo
  private createRenderProps = memoize(createRenderProps)

  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerSize?: () => void

  render() {
    let { props, context } = this
    let { options } = context

    let headerFormat = // TODO: fully pre-parse
      options.slotHeaderFormat == null ? DEFAULT_SLAT_LABEL_FORMAT :
        Array.isArray(options.slotHeaderFormat) ? createFormatter(options.slotHeaderFormat[0]) :
          createFormatter(options.slotHeaderFormat)

    let renderProps = this.createRenderProps(
      props.date,
      props.time,
      !props.isLabeled,
      props.isNarrow,
      props.isFirst,
      headerFormat,
      context,
    )

    let className = joinClassNames(
      props.liquidHeight && classNames.liquid,
      classNames.flexRow,
      classNames.alignStart,
      classNames.tight,
      props.borderTop ? classNames.borderOnlyT : classNames.borderNone,
    )

    if (!props.isLabeled) {
      return (
        <div
          className={joinClassNames(
            generateClassName(options.slotHeaderClass, renderProps),
            className,
          )}
          style={{
            height: props.height,
          }}
        />
      )
    }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          'data-time': props.isoTimeStr,
        }}
        style={{
          height: props.height,
        }}
        className={className}
        renderProps={renderProps}
        generatorName="slotHeaderContent"
        customGenerator={options.slotHeaderContent}
        defaultGenerator={renderInnerContent}
        classNameGenerator={options.slotHeaderClass}
        didMount={options.slotHeaderDidMount}
        willUnmount={options.slotHeaderWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              classNames.rigid,
              classNames.flexRow,
            )}
          >
            <InnerContent
              tag="div"
              className={generateClassName(options.slotHeaderInnerClass, renderProps)}
            />
          </div>
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
  isNarrow: boolean,
  isFirst: boolean,
  headerFormat: DateFormatter,
  context: ViewContext,
): SlotHeaderData {
  return {
    // this is a time-specific slot. not day-specific, so don't do today/nowRange
    ...getDateMeta(date, context.dateEnv),

    level: 0, // axis level (for when multiple axes)
    text: context.dateEnv.format(date, headerFormat)[0],
    time: time,
    isMajor: false,
    isMinor,
    isTime: true,
    isNarrow,
    hasNavLink: false,
    isFirst,
    view: context.viewApi,
  }
}

function renderInnerContent(props) { // TODO: add types
  return props.text
}
