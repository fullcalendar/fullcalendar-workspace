import { AllDayContentArg } from '@fullcalendar/core'
import { ComponentChild, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, setRef, watchWidth } from "@fullcalendar/core/internal"

export interface TimeGridAllDayLabelProps {
  // dimension
  width: number | undefined

  // refs
  innerWidthRef?: Ref<number>
}

export class TimeGridAllDayLabel extends BaseComponent<TimeGridAllDayLabelProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerSize?: () => void

  render() {
    let { props } = this
    let { options, viewApi } = this.context
    let renderProps: AllDayContentArg = {
      text: options.allDayText,
      view: viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        className='fc-timegrid-allday-label fc-timegrid-axis fc-cell fc-content-box'
        style={{
          width: props.width,
        }}
        renderProps={renderProps}
        generatorName="allDayContent"
        customGenerator={options.allDayContent}
        defaultGenerator={renderAllDayInner}
        classNameGenerator={options.allDayClassNames}
        didMount={options.allDayDidMount}
        willUnmount={options.allDayWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag="span"
            className='fc-timegrid-axis-inner fc-cell-inner fc-padding-sm'
            elRef={this.innerElRef}
          />
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const { props } = this
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    this.disconnectInnerSize = watchWidth(innerEl, (width) => {
      setRef(props.innerWidthRef, width)
    })
  }

  componentWillUnmount(): void {
    const { props } = this

    this.disconnectInnerSize()

    setRef(props.innerWidthRef, null)
  }
}

function renderAllDayInner(renderProps: AllDayContentArg): ComponentChild {
  return renderProps.text
}
