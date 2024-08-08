import {
  SlotLabelContentArg,
} from '@fullcalendar/core'
import {
  ViewContext,
  createFormatter,
  ViewContextType,
  ContentContainer,
  watchSize,
  setRef,
} from '@fullcalendar/core/internal'
import {
  Component,
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

export class TimeGridSlatLabel extends Component<TimeGridSlatLabelProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerSize?: () => void

  render() {
    let { props } = this
    let classNames = [
      'fcnew-rowheader',
      'fcnew-timegrid-slot',
      'fcnew-timegrid-slot-label',
      props.isLabeled ? '' : 'fcnew-timegrid-slot-minor',
    ]

    // why are we using ViewContextType.Consumer???
    return (
      <ViewContextType.Consumer>
        {(context: ViewContext) => {
          if (!props.isLabeled) {
            return (
              <td className={classNames.join(' ')} data-time={props.isoTimeStr} />
            )
          }

          let { dateEnv, options, viewApi } = context
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
                <div
                  className="fcnew-timegrid-slot-label-frame"
                  ref={this.innerElRef}
                >
                  <InnerContent
                    elTag="div"
                    elClasses={['fcnew-timegrid-slot-label-cushion']}
                  />
                </div>
              )}
            </ContentContainer>
          )
        }}
      </ViewContextType.Consumer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    // TODO: fire width/height independently?
    this.detachInnerSize = watchSize(innerEl, (width, height) => {
      setRef(this.props.innerWidthRef, width)
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerSize()
  }
}

function renderInnerContent(props) { // TODO: add types
  return props.text
}
