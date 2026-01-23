import { createAction, props } from "@ngrx/store";
import { EventInput } from "@fullcalendar/angular";

export const toggleCalendar = createAction('[Fullcalendar] Toggle Calendar');
export const createEvent = createAction('[Fullcalendar] Create Event', props<{ event: EventInput }>());
export const deleteEvent = createAction('[Fullcalendar] Delete Event', props<{ id: string }>());
