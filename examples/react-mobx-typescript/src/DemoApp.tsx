import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import {
  EventContentArg,
  EventClickArg,
  DateSelectArg,
  EventChangeArg,
} from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";

import { Sidebar } from "./Sidebar";
import { eventStoreContext } from "./event-store";

export const DemoApp = observer(function DemoApp() {
  const eventStore = useContext(eventStoreContext);

  function handleEventClick(clickInfo: EventClickArg) {
    if (
      confirm(
        `Are you sure you want to delete the event '${clickInfo.event.title}'`
      )
    ) {
      eventStore.deleteEvent(clickInfo.event.id);
    }
  }

  function handleDateSelect(selectInfo: DateSelectArg) {
    let title = prompt("Please enter a new title for your event");
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
    eventStore.addEvent(selectInfo, title);
  }

  function handleEventChange(changeInfo: EventChangeArg) {
    eventStore.changeEvent(changeInfo);
  }

  return (
    <div className="demo-app">
      <Sidebar />
      <div className="demo-app-main">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={eventStore.weekendsVisible}
          /**
           * slice() is used to achieve MobX observability on eventStore.events
           * https://mobx.js.org/best/react.html#incorrect-use-an-observable-but-without-accessing-any-of-its-properties
           */
          events={eventStore.events.slice()} //
          select={handleDateSelect}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventChange={handleEventChange}
        />
      </div>
    </div>
  );
});

function renderEventContent(eventContent: EventContentArg) {
  return (
    <>
      <b>{eventContent.timeText}</b>
      <i>{eventContent.event.title}</i>
    </>
  );
}
