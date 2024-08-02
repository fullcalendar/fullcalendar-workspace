import { AllDayContentArg } from '@fullcalendar/core'
import { ComponentChild, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, setRef, watchSize } from "@fullcalendar/core/internal"

export interface TimeGridAllDayLabelCellProps {
  // dimension
  width: number | undefined

  // refs
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
}

export class TimeGridAllDayLabelCell extends BaseComponent<TimeGridAllDayLabelCellProps> {
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
          'fcnew-rowheader'
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
          <div
            className='fc-timegrid-axis-frame'
            ref={this.innerElRef}
          >
            <InnerContent
              elTag="span"
              elClasses={[
                'fc-timegrid-axis-cushion',
                'fc-scrollgrid-sync-inner',
              ]}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect
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
