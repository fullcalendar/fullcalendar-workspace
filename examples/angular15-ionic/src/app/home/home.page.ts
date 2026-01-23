import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/angular';
import classicThemePlugin from '@fullcalendar/angular/themes/classic';
import dayGridPlugin from '@fullcalendar/angular/daygrid';
import timeGridPlugin from '@fullcalendar/angular/timegrid';

import '@fullcalendar/angular/skeleton.css'
import '@fullcalendar/angular/themes/classic/theme.css'
import '@fullcalendar/angular/themes/classic/palette.css'

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
