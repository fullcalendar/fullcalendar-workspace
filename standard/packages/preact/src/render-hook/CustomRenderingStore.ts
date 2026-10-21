import { ObservableValue } from '../util/ObservableValue'

export type CustomRenderingHandler<RenderProps> = (customRender: CustomRendering<RenderProps>) => void

export interface CustomRendering<RenderProps> {
  id: string // TODO: need this? Map can be responsible for storing key?
  isActive: boolean
  containerEl: HTMLElement
  generatorMeta: any // could be as simple as boolean
  renderProps: RenderProps
}

/*
The content areas a connector (React, Vue, Angular) renders itself: subscribers get the active ones by
id, in a Map for a consistent order, whenever one starts, changes or stops
*/
export class CustomRenderingStore<RenderProps> extends ObservableValue<Map<string, CustomRendering<RenderProps>>> {
  private map = new Map<string, CustomRendering<RenderProps>>()

  handle(customRendering: CustomRendering<RenderProps>): void {
    const { map } = this
    let updated = false

    if (customRendering.isActive) {
      map.set(customRendering.id, customRendering as CustomRendering<RenderProps>)
      updated = true
    } else if (map.has(customRendering.id)) {
      map.delete(customRendering.id)
      updated = true
    }

    if (updated) {
      this.set(map)
    }
  }
}
