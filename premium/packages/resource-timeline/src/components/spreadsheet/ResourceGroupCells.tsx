import { BaseComponent } from '@fullcalendar/core/internal'
import { Group } from '@fullcalendar/resource/internal'

export interface ResourceGroupCellsProps {
  colGroups: Group[]
  colGroupIndexes: number[]
}

export class ResourceGroupCells extends BaseComponent<ResourceGroupCellsProps> {
  render() {
    return null // TODO
  }
}
