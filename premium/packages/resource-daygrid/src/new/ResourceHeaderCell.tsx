import { BaseComponent, DateMarker } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
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
  innerElRef?: Ref<HTMLDivElement>
}

export class ResourceHeaderCell extends BaseComponent<ResourceHeaderCellProps> {
  render() {
    let { props } = this

    return (
      <ResourceLabelContainer
        elTag="div"
        elClasses={[
          HEADER_CELL_CLASS_NAME,
          'fc-resource',
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
          <div ref={props.innerElRef}>
            <InnerContent
              elTag="span"
              elClasses={[
                props.isSticky && 'fc-sticky',
              ]}
            />
          </div>
        )}
      </ResourceLabelContainer>
    )
  }
}
