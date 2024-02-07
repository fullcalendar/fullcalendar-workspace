import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { CalendarFeature } from './reducer';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FullCalendarModule,
    StoreModule.forRoot(),
    StoreModule.forFeature(CalendarFeature)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
