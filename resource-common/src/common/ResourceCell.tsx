import { createElement, BaseComponent, DateMarker, Ref, ComponentChildren } from '@fullcalendar/common'
import { Resource } from '../structs/resource'
import { ResourceLabelRoot } from './ResourceLabelRoot'

export interface ResourceCellProps {
  resource: Resource
  colSpan: number
  date?: DateMarker
  isSticky?: boolean
}

export class ResourceCell extends BaseComponent<ResourceCellProps> {
  render() {
    let { props } = this

    return (
      <ResourceLabelRoot resource={props.resource} date={props.date}>
        {(elRef: Ref<HTMLTableCellElement>, customClassNames: string[], dataAttrs, innerElRef, innerContent: ComponentChildren) => (
          <th
            ref={elRef}
            className={['fc-col-header-cell', 'fc-resource'].concat(customClassNames).join(' ')}
            colSpan={props.colSpan}
            {...dataAttrs}
          >
            <div className="fc-scrollgrid-sync-inner">
              <span
                className={[
                  'fc-col-header-cell-cushion',
                  props.isSticky ? 'fc-sticky' : '',
                ].join(' ')}
                ref={innerElRef}
              >
                {innerContent}
              </span>
            </div>
          </th>
        )}
      </ResourceLabelRoot>
    )
  }
}
