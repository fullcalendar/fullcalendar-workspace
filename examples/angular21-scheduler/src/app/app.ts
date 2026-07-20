import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FullCalendarModule,
  CalendarOptions,
  EventApi,
} from '@fullcalendar/angular';
import themePlugin from '@fullcalendar/angular/themes/classic';
import resourceTimelinePlugin from '@fullcalendar/angular-scheduler/resource-timeline'
import { RESOURCES, INITIAL_EVENTS } from './event-utils';

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
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
    plugins: [resourceTimelinePlugin, themePlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    initialView: 'resourceTimelineDay',
    initialDate: '2024-06-10',
    resources: RESOURCES,
    events: INITIAL_EVENTS,
    eventsSet: this.handleEvents.bind(this),
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

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
  }
}
