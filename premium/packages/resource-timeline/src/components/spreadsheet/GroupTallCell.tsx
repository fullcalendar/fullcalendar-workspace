import { BaseComponent, ContentContainer, generateClassName, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import { ComponentChild, createElement, createRef, Fragment, Ref } from '@fullcalendar/core/preact'
import { ColSpec, ResourceGroupHeaderContentArg } from '@fullcalendar/resource'

export interface GroupTallCellProps {
  colSpec: ColSpec
  fieldValue: any
  rowSpan?: number
  width?: number
  grow?: number
  className?: string // needed?

  // refs
  innerHeightRef?: Ref<number>
}

/*
NOT a good name anymore, because not always "tall", when in print-view
*/
export class GroupTallCell extends BaseComponent<GroupTallCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { colSpec } = props
    let renderProps: ResourceGroupHeaderContentArg = {
      fieldValue: props.fieldValue,
      view: context.viewApi,
    }

    // a grouped cell. no data that is specific to this specific resource
    // `colSpec` is for the group. a GroupSpec :(
    return (
      <ContentContainer
        tag="div"
        attrs={{
          role: 'rowheader',
          'aria-rowspan': props.rowSpan,
        }}
        className={joinClassNames(
          'fc-resource-group fc-cell',
          props.className,
        )}
        style={{
          minWidth: 0,
          width: props.width,
          flexGrow: props.grow,
        }}
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
              'fc-cell-inner fc-padding-lg fc-sticky-t',
              generateClassName(colSpec.cellInnerClassNames, renderProps),
            )}
            elRef={this.innerElRef}
          />
        )}
      </ContentContainer>
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
