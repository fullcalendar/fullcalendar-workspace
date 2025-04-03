import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import classicThemePlugin from '@fullcalendar/classic-theme';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  calendarOptions: CalendarOptions = {
    plugins: [
      classicThemePlugin,
      dayGridPlugin,
      timeGridPlugin,
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    initialView: 'dayGridMonth',
  };

  constructor() {}
}
