import { AllDayHeaderData } from '../../render-hook-misc'
import { joinClassNames } from '../../util/html'
import { type ReactNode, type Ref, createRef } from 'react'
import { BaseComponent, setRef } from '../../vdom-util'
import { ContentContainer, generateClassName } from '../../content-inject/ContentContainer'
import { watchWidth } from '../../component-util/resize-observer'
import classNames from '../../internal-classnames'

export interface TimeGridAllDayHeaderProps {
  // dimension
  width: number | undefined
  isNarrow: boolean

  // refs
  innerWidthRef?: Ref<number>
}

export class TimeGridAllDayHeader extends BaseComponent<TimeGridAllDayHeaderProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerWidth?: () => void

  render() {
    let { props } = this
    let { options, viewApi } = this.context
    let renderProps: AllDayHeaderData = {
      text: options.allDayText,
      view: viewApi,
      isNarrow: props.isNarrow,
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
        classNameGenerator={options.allDayHeaderClass}
        didMount={options.allDayHeaderDidMount}
        willUnmount={options.allDayHeaderWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag='div'
            className={joinClassNames(
              generateClassName(options.allDayHeaderInnerClass, renderProps),
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

function renderAllDayInner(renderProps: AllDayHeaderData): ReactNode {
  return renderProps.text
}
