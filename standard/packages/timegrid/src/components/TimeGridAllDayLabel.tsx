import { AllDayContentArg } from '@fullcalendar/core'
import { ComponentChild, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, generateClassName, joinClassNames, setRef, watchWidth } from "@fullcalendar/core/internal"
import classNames from '@fullcalendar/core/internal-classnames'

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
  private disconnectInnerWidth?: () => void

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
        attrs={{
          role: 'rowheader',
        }}
        className={joinClassNames(
          classNames.flexRow,
          classNames.tight,
          classNames.contentBox,
        )}
        style={{
          width: props.width,
        }}
        renderProps={renderProps}
        generatorName="allDayHeaderContent"
        customGenerator={options.allDayHeaderContent}
        defaultGenerator={renderAllDayInner}
        classNameGenerator={options.allDayHeaderClassNames}
        didMount={options.allDayHeaderDidMount}
        willUnmount={options.allDayHeaderWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag='div'
            className={joinClassNames(
              generateClassName(options.allDayHeaderInnerClassNames, renderProps),
              classNames.rigid,
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

    // TODO: only attach this if refs props present
    this.disconnectInnerWidth = watchWidth(innerEl, (width) => {
      setRef(props.innerWidthRef, width)
    })
  }

  componentWillUnmount(): void {
    this.disconnectInnerWidth()
    setRef(this.props.innerWidthRef, null)
  }
}

function renderAllDayInner(renderProps: AllDayContentArg): ComponentChild {
  return renderProps.text
}
