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
          'fcnew-timegrid-allday-label',
          'fcnew-timegrid-axis',
          'fcnew-cell',
          'fcnew-content-box',
        ]}
        elAttrs={{
          'aria-hidden': true,
        }}
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
          <div ref={this.innerElRef} className='fcnew-fcnew-flex-column'>
            <InnerContent
              elTag="span"
              elClasses={[
                'fcnew-timegrid-axis-inner',
                'fcnew-cell-inner',
                'fcnew-padding-sm',
              ]}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    this.disconnectInnerSize = watchSize(innerEl, (width, height) => {
      setRef(this.props.innerWidthRef, width)
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconnectInnerSize()
  }
}

function renderAllDayInner(renderProps: AllDayContentArg): ComponentChild {
  return renderProps.text
}
