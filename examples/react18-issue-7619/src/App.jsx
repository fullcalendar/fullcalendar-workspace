import React, { useState } from 'react';
import { addHours, startOfDay } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import momentPlugin from '@fullcalendar/moment';
import timeGridPlugin from '@fullcalendar/timegrid';
import scrollGrid from '@fullcalendar/scrollgrid';
import interactionPlugin from '@fullcalendar/interaction';

function today() {
  return startOfDay(new Date()); //new Date();
}

const PLUGINS = [
  momentPlugin,
  // resourceTimeGridPlugin,
  scrollGrid,
  interactionPlugin,
  timeGridPlugin,
];

const event = {
  id: '12',
  title: 'Hello',
  start: addHours(today(), 10),
  end: addHours(today(), 2),
  backgroundColor: 'cyan',
  textColor: 'black',
};

const ghost = {
  id: '12-ghost',
  title: 'Hello',
  start: addHours(today(), 10),
  end: addHours(today(), 2),
  backgroundColor: 'yellow',
  display: 'background',
  textColor: 'black',
};

export const DEFAULT_EVENT_BACKGROUND_COLOUR = '#F4F4F4';
export const DEFAULT_EVENT_TEXT_COLOUR = '#657884';

export function App() {
  const [events, setEvents] = useState([event]);

  function onDragStart() {
    console.log('Drag START ' + Date.now());
    setEvents([event, ghost]);
  }

  function onDragEnd() {
    console.log('Drag END ' + Date.now());
    setEvents([event]);
  }

  return (
    <div style={{ backgroundColor: 'white' }}>
      <FullCalendar
        snapDuration={'00:15:00'}
        slotDuration={'00:30:00'}
        plugins={PLUGINS}
        eventBorderColor="#E1E1E1"
        titleFormat="ddd MMM D, YYYY"
        events={events}
        allDayText="Any time"
        dayMinWidth={128}
        nowIndicator={true}
        navLinks={true}
        headerToolbar={false}
        scrollTimeReset={true}
        selectable={false}
        height={'auto'}
        eventDragStart={onDragStart}
        eventDrop={onDragEnd}
        eventResizableFromStart={true}
        eventStartEditable={true}
        eventDurationEditable={true}
        eventDragMinDistance={30}
        stickyHeaderDates={true}
      />
    </div>
  );
}

export default App;
