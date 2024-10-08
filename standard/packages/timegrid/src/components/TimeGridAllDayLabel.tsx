import { AllDayContentArg } from '@fullcalendar/core'
import { ComponentChild, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, setRef, watchSize } from "@fullcalendar/core/internal"

export interface TimeGridAllDayLabelProps {
  // dimension
  width: number | undefined

  // refs
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
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
        elTag="div"
        elClasses={[
          'fc-timegrid-allday-label',
          'fc-timegrid-axis',
          'fc-cell',
          'fc-content-box',
        ]}
        elStyle={{
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
          <div ref={this.innerElRef} className='fc-flex-column'>
            <InnerContent
              elTag="span"
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
    const { props } = this
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    this.disconnectInnerSize = watchSize(innerEl, (width, height) => {
      setRef(props.innerWidthRef, width)
      setRef(props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    const { props } = this

    this.disconnectInnerSize()

    setRef(props.innerWidthRef, null)
    setRef(props.innerHeightRef, null)
  }
}

function renderAllDayInner(renderProps: AllDayContentArg): ComponentChild {
  return renderProps.text
}
