import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import {
  EventDisplayData,
  EventClickData,
  DateSelectData,
  EventChangeData,
} from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";

import { Sidebar } from "./Sidebar";
import { eventStoreContext } from "./event-store";

export const DemoApp = observer(function DemoApp() {
  const eventStore = useContext(eventStoreContext);

  function handleEventClick(clickData: EventClickData) {
    if (
      confirm(
        `Are you sure you want to delete the event '${clickData.event.title}'`
      )
    ) {
      eventStore.deleteEvent(clickData.event.id);
    }
  }

  function handleDateSelect(selectData: DateSelectData) {
    let title = prompt("Please enter a new title for your event");
    const calendarApi = selectData.view.calendar;
    calendarApi.unselect(); // clear date selection
    eventStore.addEvent(selectData, title);
  }

  function handleEventChange(changeData: EventChangeData) {
    eventStore.changeEvent(changeData);
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

function renderEventContent(data: EventDisplayData) {
  return (
    <>
      <b>{data.timeText}</b>
      <i>{data.event.title}</i>
    </>
  );
}
