import { BaseComponent, ContentContainer, setRef, watchHeight } from '@fullcalendar/core/internal'
import { ComponentChild, createElement, createRef, Fragment, Ref } from '@fullcalendar/core/preact'
import { ColSpec, ColCellContentArg } from '@fullcalendar/resource'

export interface GroupTallCellProps {
  colSpec: ColSpec
  fieldValue: any

  // refs
  innerHeightRef?: Ref<number>
}

export class GroupTallCell extends BaseComponent<GroupTallCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { colSpec } = props
    let renderProps: ColCellContentArg = {
      groupValue: props.fieldValue,
      view: context.viewApi,
    }

    // a grouped cell. no data that is specific to this specific resource
    // `colSpec` is for the group. a GroupSpec :(
    return (
      <ContentContainer
        elTag="div"
        elAttrs={{
          role: 'gridcell',
        }}
        elClasses={[
          'fc-cell',
          'fc-liquid',
          'fc-resource-group',
        ]}
        renderProps={renderProps}
        generatorName="resourceGroupLabelContent"
        customGenerator={colSpec.cellContent}
        defaultGenerator={renderGroupInner}
        classNameGenerator={colSpec.cellClassNames}
        didMount={colSpec.cellDidMount}
        willUnmount={colSpec.cellWillUnmount}
      >
        {(InnerContent) => (
          <div ref={this.innerElRef} className='fc-flex-column fc-sticky-y'>
            <InnerContent
              elTag="div"
              elClasses={['fc-cell-inner', 'fc-padding-lg']}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current

    this.detachInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerHeight()
  }
}

function renderGroupInner(renderProps: ColCellContentArg): ComponentChild {
  return renderProps.groupValue || <Fragment>&nbsp;</Fragment>
}
