import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule, CalendarOptions, DateSelectData, EventClickData, EventApi } from '@fullcalendar/angular';
import themePlugin from '@fullcalendar/angular/themes/classic';
import interactionPlugin from '@fullcalendar/angular/interaction';
import dayGridPlugin from '@fullcalendar/angular/daygrid';
import timeGridPlugin from '@fullcalendar/angular/timegrid';
import listPlugin from '@fullcalendar/angular/list';
import resourceTimeGridPlugin from '@fullcalendar/angular-scheduler/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/angular-scheduler/resource-timeline'
import { RESOURCES, INITIAL_EVENTS, createEventId } from './event-utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  calendarVisible = signal(true);
  calendarOptions = signal<CalendarOptions>({
    plugins: [
      themePlugin,
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      resourceTimeGridPlugin,
      resourceTimelinePlugin,
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'resourceTimelineWeek,resourceTimeGridDay,dayGridMonth'
    },
    initialView: 'resourceTimelineWeek',
    initialEvents: INITIAL_EVENTS, // alternatively, use the `events` setting to fetch from a feed
    resources: RESOURCES,
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this)
    /* you can update a remote database when these fire:
    eventAdd:
    eventChange:
    eventRemove:
    */
  });
  currentEvents = signal<EventApi[]>([]);

  handleCalendarToggle() {
    this.calendarVisible.update((bool) => !bool);
  }

  handleWeekendsToggle() {
    this.calendarOptions.update((options) => ({
      ...options,
      weekends: !options.weekends,
    }));
  }

  handleDateSelect(selectInfo: DateSelectData) {
    const title = prompt('Please enter a new title for your event');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      });
    }
  }

  handleEventClick(clickInfo: EventClickData) {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
  }
}
