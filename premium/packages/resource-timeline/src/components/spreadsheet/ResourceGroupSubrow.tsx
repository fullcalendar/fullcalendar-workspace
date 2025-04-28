import { BaseComponent, ContentContainer, generateClassName, joinArrayishClassNames, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import { ComponentChild, createElement, createRef, Fragment, Ref } from '@fullcalendar/core/preact'
import { ColSpec, ResourceGroupHeaderContentArg } from '../../structs.js'

export interface ResourceGroupSubrowProps {
  colSpec: ColSpec
  fieldValue: any
  rowSpan?: number
  width?: number
  grow?: number
  className?: string
  borderStart: boolean
  borderBottom: boolean

  // aria
  role?: string
  rowIndex?: number
  level?: number

  // refs
  innerHeightRef?: Ref<number>

  // position
  top?: number
  height?: number
}

/*
NOT a good name anymore, because not always "tall", when in print-view
*/
export class ResourceGroupSubrow extends BaseComponent<ResourceGroupSubrowProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { options } = context
    let { colSpec } = props
    let renderProps: ResourceGroupHeaderContentArg = {
      fieldValue: props.fieldValue,
      view: context.viewApi,
    }

    // a grouped cell. no data that is specific to this specific resource
    // `colSpec` is for the group. a GroupSpec :(
    return (
      <div
        role={props.role as any} // !!!
        aria-rowindex={props.rowIndex}
        aria-level={props.level}
        className={joinArrayishClassNames(
          options.resourceAreaRowClassNames,
          props.className,
          'fcu-flex-row',
          props.borderBottom ? 'fcu-border-only-b' : 'fcu-border-none',
        )}
        style={{
          top: props.top,
          height: props.height,
          minWidth: 0,
          width: props.width,
          flexGrow: props.grow,
        }}
      >
        <ContentContainer
          tag="div"
          attrs={{
            role: 'rowheader',
            'aria-rowspan': props.rowSpan,
          }}
          className={joinClassNames(
            'fcu-tight fcu-liquid',
            props.borderStart ? 'fcu-border-only-s' : 'fcu-border-none',
          )}
          renderProps={renderProps}
          generatorName="resourceGroupHeaderContent"
          customGenerator={colSpec.cellContent}
          defaultGenerator={renderGroupInner}
          classNameGenerator={colSpec.cellClassNames}
          didMount={colSpec.cellDidMount}
          willUnmount={colSpec.cellWillUnmount}
        >
          {(InnerContent) => (
            <InnerContent
              tag="div"
              className={joinClassNames(
                generateClassName(colSpec.cellInnerClassNames, renderProps),
                'fcu-rigid fcu-sticky-t',
              )}
              elRef={this.innerElRef}
            />
          )}
        </ContentContainer>
      </div>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current

    this.disconnectInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconnectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}

function renderGroupInner(renderProps: ResourceGroupHeaderContentArg): ComponentChild {
  return renderProps.fieldValue || <Fragment>&nbsp;</Fragment>
}
