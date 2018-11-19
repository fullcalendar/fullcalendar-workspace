
import { Slicer, DateSpan, Seg, EventRenderRange, DateRange, EventDef } from 'fullcalendar'


export class ResourceAwareSlicer<OtherArgsType extends any[], SegType extends Seg> extends Slicer<OtherArgsType, SegType> {

  // was having trouble with TS, this the any-casts

  constructor(slice: (range: DateRange, resourceIds: string[], ...otherArgs: OtherArgsType) => SegType[]) {
    super(slice as any)
  }

  protected dateSpanToSegs(dateSpan: DateSpan, otherArgs: OtherArgsType): SegType[] {
    return (this.slice as any)(
      dateSpan.range,
      dateSpan.resourceId ? [ dateSpan.resourceId ] : [],
      ...otherArgs
    )
  }

  protected eventRangeToSegs(eventRange: EventRenderRange, otherArgs: OtherArgsType): SegType[] {
    return (this.slice as any)(
      eventRange.range,
      extractEventResourceIds(eventRange.def),
      ...otherArgs
    )
  }

}


// BAD!
// done by resource PUBLIC id
export function extractEventResourceIds(def: EventDef) {
  let resourceIds = def.extendedProps.resourceIds || [] /// put in real Def object?
  let resourceId = def.extendedProps.resourceId

  if (resourceId) {
    resourceIds.push(resourceId)
  }

  return resourceIds
}
