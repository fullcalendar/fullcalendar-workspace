
Also needs `fc` on root

## Unique `fc-` Classnames Found in Tests

### Core/Calendar Classes
- `fc-view-outer` - View wrapper container
- `fc-view` - Main view element
- `fc-toolbar` - Header toolbar
- `fc-footer-toolbar` - Footer toolbar
- `fc-toolbar-title` - Toolbar title text
- `fc-toolbar-section` - Toolbar section container
- `fc-scroller` - Scrollable container
- `fc-license-message` - License message display
- `fc-not-allowed` - Body class for cursor state

### Theme Classes
- `fc-theme-bootstrap` - Bootstrap theme
- `fc-theme-standard` - Unthemed/standard theme

### Direction Classes
- `fc-direction-ltr` - Left-to-right
- `fc-direction-rtl` - Right-to-left

### Event Classes
- `fc-event` - Generic event
- `fc-event-start` - Event starts in this segment
- `fc-event-end` - Event ends in this segment
- `fc-event-time` - Event time display
- `fc-event-title` - Event title display
- `fc-event-resizer` - Event resize handle
- `fc-event-resizer-start` - Start resize handle
- `fc-event-resizer-end` - End resize handle
- `fc-event-past` - Past event styling
- `fc-event-mirror` - Dragging mirror element
- `fc-bg-event` - Background event

### Day/Date Classes
- `fc-day-past` - Past day
- `fc-day-future` - Future day
- `fc-day-today` - Today
- `fc-day-disabled` - Disabled day
- `fc-day-sun`, `fc-day-mon`, `fc-day-tue`, `fc-day-wed`, `fc-day-thu`, `fc-day-fri`, `fc-day-sat` - Day of week

### Slot Classes (TimeGrid)
- `fc-slot-past` - Past slot
- `fc-slot-future` - Future slot
- `fc-slot-today` - Today slot
- `fc-slot-disabled` - Disabled slot
- `fc-slot-sun`, `fc-slot-mon`, `fc-slot-tue`, `fc-slot-wed`, `fc-slot-thu`, `fc-slot-fri`, `fc-slot-sat` - Day of week slots

### Other Generic Classes
- `fc-non-business` - Non-business hours
- `fc-highlight` - Highlighted/selected range
- `fc-navlink` - Navigation link
- `fc-button` - Button element
- `fc-button-group` - Button group
- `fc-icon` - Icon element
- `fc-icon-plus-square` - Plus icon
- `fc-icon-minus-square` - Minus icon

### DayGrid Specific
- `fc-daygrid-day` - Day cell
- `fc-daygrid-day-header` - Day header
- `fc-daygrid-day-number` - Day number
- `fc-daygrid-event` - DayGrid event
- `fc-daygrid-dot-event` - Dot-style event
- `fc-daygrid-more-link` - "More" link
- `fc-daygrid-week-number` - Week number
- `fc-daygrid-month-start` - Month start marker

### TimeGrid Specific
- `fc-timegrid` - TimeGrid view
- `fc-timegrid-header` - TimeGrid header
- `fc-timegrid-body` - TimeGrid body
- `fc-timegrid-allday` - All-day section
- `fc-timegrid-axis` - Time axis
- `fc-timegrid-day` - TimeGrid day column
- `fc-timegrid-slot` - Time slot
- `fc-timegrid-slot-label` - Slot label
- `fc-timegrid-slot-lane` - Slot lane
- `fc-timegrid-slot-minor` - Minor slot
- `fc-timegrid-slots` - Slots container
- `fc-timegrid-event` - TimeGrid event
- `fc-timegrid-event-short` - Short event
- `fc-timegrid-more-link` - "More" link
- `fc-timegrid-now-indicator-arrow` - Now indicator arrow
- `fc-timegrid-now-indicator-line` - Now indicator line

### MultiMonth Specific
- `fc-multimonth` - MultiMonth view
- `fc-multimonth-month` - Individual month
- `fc-multimonth-title` - Month title
- `fc-multimonth-header-row` - Header row

### List View Specific
- `fc-list` - List view
- `fc-list-event` - List event
- `fc-list-event-dot` - Event dot
- `fc-list-event-title` - Event title
- `fc-list-event-time` - Event time
- `fc-list-day-text` - Day main text
- `fc-list-day-side-text` - Day side text

### Popover Classes
- `fc-more-popover` - More events popover
- `fc-popover-header` - Popover header
- `fc-popover-title` - Popover title
- `fc-popover-close` - Popover close button

### Resource (Premium) Classes
- `fc-resource` - Resource element
- `fc-resource-group` - Resource group
- `fc-resource-daygrid` - Resource DayGrid view
- `fc-resource-timegrid` - Resource TimeGrid view
- `fc-resource-timeline` - Resource Timeline view

### DataGrid (Premium) Classes
- `fc-cell` - Grid cell
- `fc-cell-main` - Cell main content
- `fc-datagrid-header` - DataGrid header
- `fc-datagrid-body` - DataGrid body
- `fc-datagrid-icon-expander` - Expander icon
- `fc-datagrid-col-resizer` - Column resizer

### Timeline (Premium) Classes
- `fc-timeline` - Timeline view
- `fc-timeline-header` - Timeline header
- `fc-timeline-body` - Timeline body
- `fc-timeline-lane` - Timeline lane
- `fc-timeline-event` - Timeline event
- `fc-timeline-slot-lane` - Timeline slot lane
- `fc-timeline-slot-label` - Timeline slot label
- `fc-timeline-more-link` - "More" link
- `fc-timeline-now-indicator-arrow` - Now indicator arrow
- `fc-timeline-now-indicator-line` - Now indicator line

---

## Dynamically Constructed Strings & Regex Patterns

### 🔍 **Regex Patterns:**

1. **View name extraction:**
   ```typescript
   .match(/fc-(\w+)-view/)[1]
   ```
   Location: `standard/tests/src/lib/wrappers/CalendarWrapper.ts:53`

2. **Button name extraction:**
   ```typescript
   .match(/fc-(\w+)-button/)[1]
   ```
   Location: `standard/tests/src/lib/wrappers/ToolbarWrapper.ts:65`

### 🔨 **Dynamically Constructed Classnames:**

1. **Button selectors:**
   ```typescript
   `.fc-${name}-button`
   ```
   Location: `standard/tests/src/lib/wrappers/ToolbarWrapper.ts:8, 30`

2. **Day of week classes (arrays):**
   ```typescript
   ['fc-day-sun', 'fc-day-mon', 'fc-day-tue', 'fc-day-wed', 'fc-day-thu', 'fc-day-fri', 'fc-day-sat']
   ['fc-slot-sun', 'fc-slot-mon', 'fc-slot-tue', 'fc-slot-wed', 'fc-slot-thu', 'fc-slot-fri', 'fc-slot-sat']
   ```
   Location: `standard/tests/src/lib/wrappers/CalendarWrapper.ts:22-23`

3. **Dynamic DOW selectors:**
   ```typescript
   `.fc-day-${dayAbbrev}`
   `.fc-slot-${dayAbbrev}`
   ```
   Locations: Multiple wrapper files

4. **Icon prefix (configurable):**
   ```typescript
   getButtonInfo(name, iconPrefix = 'fc-icon')
   ```
   Location: `standard/tests/src/lib/wrappers/ToolbarWrapper.ts:12`

All patterns look legitimate and are used for test assertions. No suspicious or unexpected dynamic string constructions detected! ✅
