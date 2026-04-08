import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { formatDate, } from '@fullcalendar/react';
import FullCalendar from '@fullcalendar/react';
import themePlugin from '@fullcalendar/react/themes/classic';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import { INITIAL_EVENTS, createEventId } from './event-utils';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';
export default class DemoApp extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            weekendsVisible: true,
            currentEvents: []
        };
        this.handleWeekendsToggle = () => {
            this.setState({
                weekendsVisible: !this.state.weekendsVisible
            });
        };
        this.handleDateSelect = (selectInfo) => {
            let title = prompt('Please enter a new title for your event');
            let calendarApi = selectInfo.view.calendar;
            calendarApi.unselect(); // clear date selection
            if (title) {
                calendarApi.addEvent({
                    id: createEventId(),
                    title,
                    start: selectInfo.startStr,
                    end: selectInfo.endStr,
                    allDay: selectInfo.allDay
                });
            }
        };
        this.handleEventClick = (clickInfo) => {
            if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
                clickInfo.event.remove();
            }
        };
        this.handleEvents = (events) => {
            this.setState({
                currentEvents: events
            });
        };
    }
    render() {
        return (_jsxs("div", { className: 'demo-app', children: [this.renderSidebar(), _jsx("div", { className: 'demo-app-main', children: _jsx(FullCalendar, { plugins: [themePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin], headerToolbar: {
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }, initialView: 'dayGridMonth', editable: true, selectable: true, selectMirror: true, dayMaxEvents: true, weekends: this.state.weekendsVisible, initialEvents: INITIAL_EVENTS, select: this.handleDateSelect, eventContent: renderEventContent, eventClick: this.handleEventClick, eventsSet: this.handleEvents }) })] }));
    }
    renderSidebar() {
        return (_jsxs("div", { className: 'demo-app-sidebar', children: [_jsxs("div", { className: 'demo-app-sidebar-section', children: [_jsx("h2", { children: "Instructions" }), _jsxs("ul", { children: [_jsx("li", { children: "Select dates and you will be prompted to create a new event" }), _jsx("li", { children: "Drag, drop, and resize events" }), _jsx("li", { children: "Click an event to delete it" })] })] }), _jsx("div", { className: 'demo-app-sidebar-section', children: _jsxs("label", { children: [_jsx("input", { type: 'checkbox', checked: this.state.weekendsVisible, onChange: this.handleWeekendsToggle }), "toggle weekends"] }) }), _jsxs("div", { className: 'demo-app-sidebar-section', children: [_jsxs("h2", { children: ["All Events (", this.state.currentEvents.length, ")"] }), _jsx("ul", { children: this.state.currentEvents.map(renderSidebarEvent) })] })] }));
    }
}
function renderEventContent(info) {
    return (_jsxs(_Fragment, { children: [_jsx("b", { children: info.timeText }), _jsx("i", { children: info.event.title })] }));
}
function renderSidebarEvent(event) {
    return (_jsxs("li", { children: [_jsx("b", { children: formatDate(event.start, { year: 'numeric', month: 'short', day: 'numeric' }) }), _jsx("i", { children: event.title })] }, event.id));
}
//# sourceMappingURL=DemoApp.js.map