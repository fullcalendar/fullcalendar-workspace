import React, { useContext } from "react";
import { observer } from "mobx-react-lite";

import { eventStoreContext } from "./event-store";
import { formatDate, EventInput } from "@fullcalendar/core";

export const Sidebar = observer(function Sidebar() {
  const eventStore = useContext(eventStoreContext);

  function renderSidebarEvent(event: EventInput) {
    return (
      <li key={event.id}>
        <button onClick={() => eventStore.deleteEvent(event.id!)}>x</button>
        <b>
          {formatDate(event.start!, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </b>
        <i>{event.title}</i>
      </li>
    );
  }

  return (
    <div className="demo-app-sidebar">
      <div className="demo-app-sidebar-section">
        <h2>Instructions</h2>
        <ul>
          <li>Select dates and you will be prompted to create a new event</li>
          <li>Drag, drop, and resize events</li>
          <li>Click an event to delete it</li>
        </ul>
      </div>
      <div className="demo-app-sidebar-section">
        <label>
          <input
            type="checkbox"
            checked={eventStore.weekendsVisible}
            onChange={() => {
              eventStore.toggleWeekends();
            }}
          ></input>
          toggle weekends
        </label>
      </div>
      <div className="demo-app-sidebar-section">
        <h2>All Events ({eventStore.events.length})</h2>
        <ul>{eventStore.events.map(renderSidebarEvent)}</ul>
      </div>
    </div>
  );
});
