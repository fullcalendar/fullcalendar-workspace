import {
  SlotLabelContentArg,
} from '@fullcalendar/core'
import {
  createFormatter,
  ContentContainer,
  watchSize,
  setRef,
  BaseComponent,
} from '@fullcalendar/core/internal'
import {
  Ref,
  createElement,
  createRef,
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
  width: number | undefined

  // ref
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
}

export class TimeGridSlatLabel extends BaseComponent<TimeGridSlatLabelProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerSize?: () => void

  render() {
    let { props, context } = this
    let { dateEnv, options, viewApi } = context

    let classNames = [
      'fc-timegrid-slot-label',
      'fc-timegrid-axis',
      'fc-cell',
      'fc-content-box',
    ]

    if (!props.isLabeled) {
      return (
        <div
          data-time={props.isoTimeStr}
          className={classNames.join(' ')}
          style={{
            width: props.width,
          }}
        />
      )
    }

    let labelFormat = // TODO: fully pre-parse
      options.slotLabelFormat == null ? DEFAULT_SLAT_LABEL_FORMAT :
        Array.isArray(options.slotLabelFormat) ? createFormatter(options.slotLabelFormat[0]) :
          createFormatter(options.slotLabelFormat)

    let renderProps: SlotLabelContentArg = {
      level: 0, // QUESTION!!!: what is this?
      time: props.time,
      date: dateEnv.toDate(props.date),
      view: viewApi,
      text: dateEnv.format(props.date, labelFormat),
    }

    return (
      <ContentContainer
        elTag="div"
        elClasses={classNames}
        elAttrs={{
          'data-time': props.isoTimeStr,
        }}
        elStyle={{
          width: props.width,
        }}
        renderProps={renderProps}
        generatorName="slotLabelContent"
        customGenerator={options.slotLabelContent}
        defaultGenerator={renderInnerContent}
        classNameGenerator={options.slotLabelClassNames}
        didMount={options.slotLabelDidMount}
        willUnmount={options.slotLabelWillUnmount}
      >
        {(InnerContent) => (
          <div ref={this.innerElRef} className='fc-flex-column'>
            <InnerContent
              elTag="div"
              elClasses={[
                'fc-timegrid-axis-inner',
                'fc-cell-inner',
                'fc-padding-sm',
              ]}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    if (innerEl) { // could be null if !isLabeled
      // TODO: only attach this if refs props present
      // TODO: fire width/height independently?
      this.detachInnerSize = watchSize(innerEl, (width, height) => {
        setRef(this.props.innerWidthRef, width)
        setRef(this.props.innerHeightRef, height)
      })
    }
  }

  componentWillUnmount(): void {
    if (this.detachInnerSize) {
      this.detachInnerSize()
    }
  }
}

function renderInnerContent(props) { // TODO: add types
  return props.text
}
