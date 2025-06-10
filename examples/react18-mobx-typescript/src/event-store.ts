import { createContext } from "react";
import { observable, action } from "mobx";
import { EventInput, DateSelectData, EventChangeData } from "@fullcalendar/core";

export class EventStore {
  @observable
  weekendsVisible = true;

  private eventGuid = 0;

  @observable
  events: EventInput[] = [
    {
      id: this.createEventId(),
      title: "All-day event",
      start: new Date(),
      allDay: true,
    },
    {
      id: this.createEventId(),
      title: "Timed event",
      start: new Date(),
      allDay: false,
    },
  ];

  getEvents(): EventInput[] {
    return this.events;
  }

  private createEventId() {
    return String(this.eventGuid++);
  }

  @action
  addEvent(selectData: DateSelectData, title: string | null) {
    this.events.push({
      id: this.createEventId(),
      title: title || "New Event",
      start: selectData.start,
      end: selectData.end,
      allDay: selectData.allDay,
    });
  }

  @action
  deleteEvent(id: string) {
    this.events.splice(
      this.events.findIndex((e) => e.id == id),
      1
    );
  }

  @action
  changeEvent(changeData: EventChangeData) {
    const newEvent = changeData.event;
    const storedEvent = this.events.find((e) => e.id == changeData.event.id);
    if (storedEvent) {
      storedEvent.title = newEvent.title;
      storedEvent.allDay = newEvent.allDay;
      storedEvent.start = newEvent.start || storedEvent.start;
      storedEvent.end = newEvent.end || storedEvent.end;
    }
  }

  @action
  toggleWeekends() {
    this.weekendsVisible = !this.weekendsVisible;
  }
}

export const eventStoreContext = createContext(new EventStore());
