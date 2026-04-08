import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import {
  EventDisplayInfo,
  EventClickInfo,
  DateSelectInfo,
  EventChangeInfo,
} from "@fullcalendar/react";
import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/classic";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import timeGridPlugin from "@fullcalendar/react/timegrid";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import { Sidebar } from "./Sidebar";
import { eventStoreContext } from "./event-store";

export const DemoApp = observer(function DemoApp() {
  const eventStore = useContext(eventStoreContext);

  function handleEventClick(clickInfo: EventClickInfo) {
    if (
      confirm(
        `Are you sure you want to delete the event '${clickInfo.event.title}'`
      )
    ) {
      eventStore.deleteEvent(clickInfo.event.id);
    }
  }

  function handleDateSelect(selectInfo: DateSelectInfo) {
    let title = prompt("Please enter a new title for your event");
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
    eventStore.addEvent(selectInfo, title);
  }

  function handleEventChange(changeInfo: EventChangeInfo) {
    eventStore.changeEvent(changeInfo);
  }

  return (
    <div className="demo-app">
      <Sidebar />
      <div className="demo-app-main">
        <FullCalendar
          plugins={[themePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
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

function renderEventContent(info: EventDisplayInfo) {
  return (
    <>
      <b>{info.timeText}</b>
      <i>{info.event.title}</i>
    </>
  );
}
