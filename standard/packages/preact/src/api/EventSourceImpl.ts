import { EventSource } from '../structs/event-source'
import { CalendarContext } from '../CalendarContext'
import { EventSourceApi } from './EventSourceApi'

export class EventSourceImpl implements EventSourceApi {
  constructor(
    private context: CalendarContext,
    public internalEventSource: EventSource<any>, // rename?
  ) {
  }

  remove(): void {
    this.context.calendarApi.store!.actions.removeEventSource(this.internalEventSource.sourceId)
  }

  refetch(): void {
    this.context.calendarApi.store!.actions.refetchEventSource(this.internalEventSource.sourceId)
  }

  get id(): string {
    return this.internalEventSource.publicId
  }

  get url(): string {
    return this.internalEventSource.meta.url
  }

  get format(): string {
    return this.internalEventSource.meta.format // TODO: bad. not guaranteed
  }
}
