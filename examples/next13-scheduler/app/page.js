'use client';

import FullCalendar from '@fullcalendar/react';
import themePlugin from '@fullcalendar/react/themes/classic';
import interactionPlugin from '@fullcalendar/react/interaction'
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline';

import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

const todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today

export default function Home() {
  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[themePlugin, interactionPlugin, dayGridPlugin, timeGridPlugin, resourceTimelinePlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'resourceTimelineDay,resourceTimelineWeek',
        }}
        initialView="resourceTimelineDay"
        initialDate={todayStr}
        scrollTime='08:00'
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
          { title: 'event1', start: todayStr + 'T09:00:00', resourceId: 'a' },
          { title: 'event2', start: todayStr + 'T09:00:00', resourceId: 'a' },
          { title: 'event3', start: todayStr + 'T09:00:00', resourceId: 'a' },
          { title: 'event4', start: todayStr + 'T09:00:00', resourceId: 'a' },
          { title: 'event5', start: todayStr + 'T09:00:00', resourceId: 'a' },
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
