import '@fullcalendar/core/global.css'
import './style.css'

import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'
import interactionPlugin from '@fullcalendar/interaction'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import themePlugin from './theme.js'

const enablePremium = true

/*
Resizing timeline events is whack
when drawn as a mirror-event in another resource lane
TODO: rename "mirror"?
*/

document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar')!
  let calendar: Calendar

  if (!enablePremium) {
    calendar = new Calendar(calendarEl, {
      eventResizableFromStart: true,
      // stickyHeaderDates: true, -- makes things broken sometimes!
      weekNumbers: true,
      plugins: [
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin,
        multiMonthPlugin,
        themePlugin,
      ],
      initialDate: '2023-01-12',
      initialView: 'timeGridWeek',
      nowIndicator: true,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek,multiMonthYear'
      },
      navLinks: true, // can click day/week names to navigate views
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true, // allow "more" link when too many events
      // businessHours: true, // looks whack, covering lots of things
      // eventMaxStack: 1,
      events: [
        {
          title: 'All Day Event',
          start: '2023-01-01',
        },
        {
          title: 'Long Event',
          start: '2023-01-07',
          end: '2023-01-10'
        },
        {
          groupId: '999',
          title: 'Repeating Event',
          start: '2023-01-09T16:00:00'
        },
        {
          groupId: '999',
          title: 'Repeating Event',
          start: '2023-01-16T16:00:00'
        },
        {
          title: 'Conference',
          start: '2023-01-11',
          end: '2023-01-13',
          display: 'background',
        },
        {
          title: 'Meeting',
          start: '2023-01-12T12:00:00'
        },
        {
          title: 'Lunch',
          start: '2023-01-12T12:00:00'
        },
        {
          title: 'Meeting',
          start: '2023-01-12T14:30:00'
        },
        {
          title: 'Happy Hour',
          start: '2023-01-12T17:30:00'
        },
        {
          title: 'Dinner',
          start: '2023-01-12T20:00:00'
        },
        {
          title: 'Birthday Party',
          start: '2023-01-13T07:00:00'
        },
        {
          title: 'Click for Google',
          url: 'http://google.com/',
          start: '2023-01-28'
        }
      ]
    })
  } else {
    calendar = new Calendar(calendarEl, {
      plugins: [
        resourceTimelinePlugin,
        interactionPlugin,
        themePlugin,
      ],
      initialDate: '2023-01-07',
      initialView: 'resourceTimelineDay',
      editable: true,
      selectable: true,
      nowIndicator: true,
      aspectRatio: 1.8,
      scrollTime: '00:00',
      headerToolbar: {
        left: 'today prev,next',
        center: 'title',
        right: 'resourceTimelineDay,resourceTimelineThreeDays'
      },
      buttons: {
        resourceTimelineThreeDays: {
          text: '3 days',
        }
      },
      views: {
        resourceTimelineThreeDays: {
          type: 'resourceTimeline',
          duration: { days: 3 },
        }
      },
      resourceAreaWidth: '40%',
      resourceGroupField: 'building', // --- THIS
      resourceAreaColumns: [
        {
          // group: true, // --- OR THIS
          headerContent: 'Building',
          field: 'building'
        },
        {
          headerContent: 'Room',
          field: 'title'
        },
        {
          headerContent: 'Occupancy',
          field: 'occupancy'
        }
      ],
      resources: [
        { id: 'a', building: '460 Bryant', title: 'Auditorium A', occupancy: 40 },
        { id: 'b', building: '460 Bryant', title: 'Auditorium B', occupancy: 40, eventColor: 'green' },
        { id: 'c', building: '460 Bryant', title: 'Auditorium C', occupancy: 40, eventColor: 'orange' },
        { id: 'd', building: '460 Bryant', title: 'Auditorium D', occupancy: 40, children: [
          { id: 'd1', title: 'Room D1', occupancy: 10 },
          { id: 'd2', title: 'Room D2', occupancy: 10 }
        ] },
        { id: 'e', building: '460 Bryant', title: 'Auditorium E', occupancy: 40 },
        { id: 'f', building: '460 Bryant', title: 'Auditorium F', occupancy: 40, eventColor: 'red' },
        { id: 'g', building: '564 Pacific', title: 'Auditorium G', occupancy: 40 },
        { id: 'h', building: '564 Pacific', title: 'Auditorium H', occupancy: 40 },
        { id: 'i', building: '564 Pacific', title: 'Auditorium I', occupancy: 40 },
        { id: 'j', building: '564 Pacific', title: 'Auditorium J', occupancy: 40 },
        { id: 'k', building: '564 Pacific', title: 'Auditorium K', occupancy: 40 },
        { id: 'l', building: '564 Pacific', title: 'Auditorium L', occupancy: 40 },
        { id: 'm', building: '564 Pacific', title: 'Auditorium M', occupancy: 40 },
        { id: 'n', building: '564 Pacific', title: 'Auditorium N', occupancy: 40 },
        { id: 'o', building: '564 Pacific', title: 'Auditorium O', occupancy: 40 },
        { id: 'p', building: '564 Pacific', title: 'Auditorium P', occupancy: 40 },
        { id: 'q', building: '564 Pacific', title: 'Auditorium Q', occupancy: 40 },
        { id: 'r', building: '564 Pacific', title: 'Auditorium R', occupancy: 40 },
        { id: 's', building: '564 Pacific', title: 'Auditorium S', occupancy: 40 },
        { id: 't', building: '564 Pacific', title: 'Auditorium T', occupancy: 40 },
        { id: 'u', building: '564 Pacific', title: 'Auditorium U', occupancy: 40 },
        { id: 'v', building: '564 Pacific', title: 'Auditorium V', occupancy: 40 },
        { id: 'w', building: '564 Pacific', title: 'Auditorium W', occupancy: 40 },
        { id: 'x', building: '564 Pacific', title: 'Auditorium X', occupancy: 40 },
        { id: 'y', building: '564 Pacific', title: 'Auditorium Y', occupancy: 40 },
        { id: 'z', building: '564 Pacific', title: 'Auditorium Z', occupancy: 40 }
      ],
      events: [
        { id: '1', resourceId: 'b', start: '2023-01-07T02:00:00', end: '2023-01-07T07:00:00', title: 'event 1' },
        { id: '2', resourceId: 'c', start: '2023-01-07T05:00:00', end: '2023-01-07T22:00:00', title: 'event 2' },
        { id: '3', resourceId: 'd', start: '2023-01-06', end: '2023-01-08', title: 'event 3' },
        { id: '4', resourceId: 'e', start: '2023-01-07T03:00:00', end: '2023-01-07T08:00:00', title: 'event 4' },
        { id: '5', resourceId: 'f', start: '2023-01-07T00:30:00', end: '2023-01-07T02:30:00', title: 'event 5' },
        { id: '5', resourceId: 'f', start: '2023-01-07T00:30:00', end: '2023-01-07T02:30:00', title: 'event 5' },
      ],
      eventMaxStack: 1,
    })
  }

  calendar.render()
})
