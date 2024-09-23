import { BaseComponent, DateMarker, setRef, watchHeight } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { HEADER_CELL_CLASS_NAME } from '@fullcalendar/daygrid/internal'
import { Resource, ResourceLabelContainer } from '@fullcalendar/resource/internal'

export interface ResourceHeaderCellProps {
  resource: Resource
  date?: DateMarker
  colSpan: number
  isSticky?: boolean

  // dimensions
  colWidth?: number

  // ref
  innerHeightRef?: Ref<number>
}

export class ResourceHeaderCell extends BaseComponent<ResourceHeaderCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconectInnerHeight?: () => void

  render() {
    let { props } = this

    return (
      <ResourceLabelContainer
        elTag="div"
        elClasses={[
          'fcnew-cell',
          props.colWidth != null ? '' : 'fcnew-liquid',
          HEADER_CELL_CLASS_NAME,
          'fcnew-resource',
        ]}
        elStyle={{
          width: props.colWidth != null // TODO: DRY
            ? props.colWidth * (props.colSpan || 1)
            : undefined,
        }}
        resource={props.resource}
        date={props.date}
      >
        {(InnerContent) => (
          <div ref={this.innerElRef}>
            <InnerContent
              elTag="span"
              elClasses={[
                'fcnew-col-header-cell-cushion',
                props.isSticky ? 'fcnew-h-sticky' : '',
              ]}
            />
          </div>
        )}
      </ResourceLabelContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    this.disconectInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconectInnerHeight()
  }
}
