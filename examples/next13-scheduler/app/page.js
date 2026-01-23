'use client';

import FullCalendar from '@fullcalendar/react';
import themePlugin from '@fullcalendar/react/themes/classic';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline';

import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

export default function Home() {
  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[themePlugin, dayGridPlugin, timeGridPlugin, resourceTimelinePlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
        }}
        initialView="resourceTimelineDay"
        nowIndicator={true}
        editable={true}
        selectable={true}
        selectMirror={true}
        resources={[
          { id: 'a', title: 'Auditorium A' },
          { id: 'b', title: 'Auditorium B', eventColor: 'green' },
          { id: 'c', title: 'Auditorium C', eventColor: 'orange' },
        ]}
        initialEvents={[
          { title: 'event1', start: new Date(), resourceId: 'a' },
          { title: 'event2', start: new Date(), resourceId: 'a' },
          { title: 'event3', start: new Date(), resourceId: 'a' },
          { title: 'event4', start: new Date(), resourceId: 'a' },
          { title: 'event5', start: new Date(), resourceId: 'a' },
        ]}
        eventContent={(eventInfo) => {
          return (
            <>
              <b>{eventInfo.timeText}</b>
              <i>{eventInfo.event.title}</i>
            </>
          );
        }}
      />
    </div>
  );
}
