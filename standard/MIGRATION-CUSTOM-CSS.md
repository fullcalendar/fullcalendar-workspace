
# Upgrade Guide for Custom CSS

<!--
TODOs in current v7 codebase:
.fc-timegrid-weeknumber -> .fc-timegrid-week-number (to match with .fc-daygrid-week-number)
+ .fc-week-number
.fc-navlink -> .fc-nav-link (adjust below)
.fc-celldivider -> .fc-cell-divider
.fc-rowdivider -> .fc-row-divider
.fc-fill-start -> .fc-fill-s
.fc-fill-top -> .fc-fill-t
.fc-table-header renamed?
.fc-timegrid-slots needed?
.fc-timegrid-slots-axis needed?
.fc-timeline-slots needed?
KILL unused .fc-offscreen
Expose an equiv for fc-timegrid-event-harness-inset, to adjust padding

TODO: add .fc-cell to daygrid/timegrid body days,
then change below selector above to:
  .fc td ➡️ .fc-cell:not(.fc-header-cell)
-->


## Tag Changes

Table markup such as `<table>/<tbody>/<tr>/<td>/<th>` is no longer used. Your selectors should target class-names instead:

```css
.fc th  ➡️  .fc-header-cell
.fc td  ➡️  .fc [role=gridcell]
```

Don't target the following by tag-name anymore:

```css
.fc h2           ➡️  .fc-toolbar-title /* not <h2> anymore! is [role=header] */
a[data-navlink]  ➡️  .fc-navlink       /* not <a> anymore!  is [role=button] */
a.fc-more-link   ➡️  .fc-more-link     /* not <a> anymore!  is [role=link] */
```


## Calendar View's Outer Border

The v6 DOM structure and CSS made if difficult to remove the calendar view's outer border. You may have needed to rely on hack such as these:

```css
.fc th { border-top: 0 }
.fc tr:last-child > td { border-bottom: 0 }
.fc td:first-child { border-left: 0 }
.fc td:last-child { border-right: 0 }
.fc-scrollgrid { border: 0 }
```

There's now an easier way to do it:

```css
.fc-view.fc-border {
  border: 0;
}
```


## Data Attributes

As mentioned above, `data-navlink` is no longer present in the markup. Adjust your selectors:

```css
.fc [data-navlink]  ➡️  .fc-navlink
```


## Class-Names

### Theme

```css
.fc-cell-shaded { background-color: red }              ➡️  .fc { --fc-neutral-bg-color: red }
.fc-theme-bootstrap5-shaded { background-color: red }  ➡️
```

### Toolbar

```css
.fc-toolbar-ltr    ⛔  /* no equivalent */
.fc-toolbar-chunk  ➡️  .fc-toolbar-section
```

### View Container

```css
.fc-view-harness          ➡️  .fc-view-outer
.fc-view-harness-active   ⛔  /* no equivalent */
.fc-view-harness-passive  ⛔  /* no equivalent */
```

### Events

```css
.fc-event-main             ➡️  .fc-event-inner
.fc-event-main-frame       ➡️  .fc-event-inner
.fc-event-title-container  ➡️  .fc-event-title-outer
```

### DayGrid & TimeGrid Header

```css
.fc-col-header               ➡️  .fc-daygrid-header,
                             ➡️  .fc-timegrid-header

.fc-col-header-cell          ➡️  .fc-daygrid-header .fc-cell,
                             ➡️  .fc-timegrid-header .fc-cell

.fc-col-header-cell-cushion  ➡️  .fc-daygrid-header .fc-cell-inner,
                             ➡️  .fc-timegrid-header .fc-cell-inner
```

### DayGrid

```css
.fc-daygrid-body-balanced      ⛔  /* no equivalent */
.fc-daygrid-body-natural       ⛔  /* no equivalent */
.fc-daygrid-body-unbalanced    ⛔  /* no equivalent */

.fc-daygrid-day-frame          ⛔  /* no equivalent. wrapped fc-daygrid-day */
.fc-daygrid-day-bg             ⛔  /* no equivalent. wrapped fc-highlight, fc-non-business, fc-bg-event */
.fc-daygrid-day-top            ➡️  .fc-daygrid-day-header
.fc-daygrid-day-bottom         ⛔  /* no equivalent. wrapped fc-daygrid-more-link */

.fc-daygrid-event-harness      ⛔  /* no equivalent. wrapped fc-daygrid-event */
.fc-daygrid-event-harness-abs  ⛔  /* no equivalent. wrapped fc-daygrid-event */
.fc-daygrid-bg-harness         ⛔  /* no equivalent. wrapped fc-bg-event */
```

### TimeGrid

```css
.fc-timegrid-divider              ➡️  .fc-timegrid .fc-rowdivider
.fc-timegrid-cols                 ➡️  .fc-timegrid-body
.fc-timegrid-col                  ➡️  .fc-timegrid-day
.fc-timegrid-col-frame            ⛔  /* no equivalent */
.fc-timegrid-col-events           ➡️  .fc-timegrid-day-events
.fc-timegrid-col-misc             ➡️  .fc-timegrid-day-misc
.fc-timegrid-col-bg               ⛔  /* no equivalent. wrapped fc-highlight, fc-non-business, fc-bg-event */
.fc-timegrid-bg-harness           ⛔  /* no equivalent. wrapped fc-bg-event */
.fc-timegrid-event-harness        ⛔  /* no equivalent. wrapped fc-timegrid-event */
.fc-timegrid-event-harness-inset  ⛔  /* no equivalent */
.fc-timegrid-slot-label-frame     ⛔  /* no equivalent. wrapped cell-inner */
.fc-timegrid-slot-label-cushion   ➡️  .fc-timegrid-slot-label .fc-cell-inner
.fc-timegrid-axis-chunk           ⛔  /* no equivalent */
.fc-timegrid-axis-frame           ⛔  /* no equivalent */
.fc-timegrid-axis-frame-liquid    ⛔  /* no equivalent */
.fc-timegrid-axis-cushion         ➡️  .fc-timegrid-axis-inner
```

## List-View

```css
.fc-list-table          ⛔  /* no more inner table within fc-list */
.fc-list-sticky         ➡️  .fc-list-day-outer-sticky
.fc-list-day            ➡️  .fc-list-day-outer ⚠️ /* rotated meanings! */
.fc-list-day-cushion    ➡️  .fc-list-day       ⚠️ /* rotated meanings! */
.fc-list-empty-cushion  ➡️  .fc-list-empty-inner
.fc-event-forced-url    ➡️  a.fc-list-event
.fc-list-event-graphic  ➡️  .fc-list-event-dot-outer
```

### Multi-Month View

```css
.fc-multimonth-compact        ➡️  .fc-multimonth-multicol ⚠️ /* similar but not equivalent */
.fc-multimonth-header-table   ⛔  /* no more inner table within fc-multimonth-header */
.fc-multimonth-daygrid        ➡️  .fc-multimonth-body
.fc-multimonth-daygrid-table  ⛔  /* no more inner table within fc-multimonth-body */
```

### Timeline & Resource-Timeline

```css
.fc-timeline-header-row         ⚠️  /* instead, style cells directly: */
                                    .fc-timeline-header .fc-cell
.fc-timeline-header-row-chrono  ⚠️  /* instead, style cells directly: */
                                    .fc-timeline-header .fc-slot

.fc-timeline-body-expandrows    ⛔  /* no equivalent */
.fc-timeline-slot-cushion       ➡️  .fc-timeline-header .fc-cell-inner
.fc-timeline-slot-frame         ⛔  /* no equivalent. was inner-wrapper for fc-timeline-slot */
.fc-timeline-lane-frame         ⛔  /* no equivalent. was inner-wrapper for fc-timeline-lane */
.fc-timeline-event-harness      ⛔  /* no equivalent. wrapped fc-timeline-event */
.fc-timeline-bg                 ⛔  /* no equivalent */
.fc-timeline-bg-harness         ⛔  /* no equivalent */
```

### Resource-Timeline Only

```css
.fc-resource-timeline-flat      ⛔  /* no equivalent */
.fc-resource-timeline-divider   ➡️  .fc-resource-timeline .fc-celldivider
.fc-datagrid-cell-super         ⚠️  /* user-defined with `resourceAreaHeaderClass` */
.fc-datagrid-cell-resizer       ➡️  .fc-datagrid-col-resizer

.fc-datagrid-cell-frame         ⛔  /* no equivalent. was inner-wrapper for cell */
.fc-datagrid-cell-frame-liquid  ⛔  /* no equivalent. was inner-wrapper for cell */
.fc-datagrid-cell               ➡️  .fc-datagrid-body .fc-cell
.fc-datagrid-cell-cushion       ➡️  .fc-datagrid-body .fc-cell-inner
.fc-datagrid-cell-main          ➡️  .fc-datagrid-body .fc-cell-main

.fc-main-col  ➡️  .fc-datagrid-body .fc-cell.fc-resource[role=rowheader]

.fc-datagrid-expander-placeholder  ➡️
                  .fc-datagrid-indent .fc-icon:last-child:not(.fc-datagrid-expander)
```

### Utilities

```css
.fc-sticky  ➡️  .fc-list-day-outer-sticky, /* list-view */
            ➡️  .fc-sticky-t,              /* timegrid events */
            ➡️  .fc-sticky-s               /* daygrid/timeline events, header-cell inners */

.fc-scrollgrid-section-header  ➡️  .fc-daygrid-header,
                               ➡️  .fc-timegrid-header,
                               ➡️  .fc-datagrid-header,
                               ➡️  .fc-timeline-header

.fc-scrollgrid-section-body    ➡️  .fc-daygrid-body,
                               ➡️  .fc-timegrid-body,
                               ➡️  .fc-datagrid-body,
                               ➡️  .fc-timeline-body

.fc-scrollgrid-section-sticky  ➡️  .fc-table-header-sticky,
                               ➡️  .fc-footer-scrollbar-sticky

.fc-scrollgrid-section-footer  ➡️  .fc-footer-scrollbar

.fc-scroller-harness           ⛔  /* no equivalent. wrapped fc-scroller */
.fc-scroller-harness-liquid    ⛔  /* no equivalent. wrapped fc-scroller */
.fc-scroller-liquid            ⛔  /* no equivalent */
.fc-scroller-liquid-absolute   ⛔  /* no equivalent */
.fc-scrollgrid                 ⛔  /* no equivalent */
.fc-scrollgrid-collapsible     ⛔  /* no equivalent */
.fc-scrollgrid-liquid          ⛔  /* no equivalent */
.fc-scrollgrid-section         ⛔  /* no equivalent */
.fc-scrollgrid-section-liquid  ⛔  /* no equivalent */
.fc-scrollgrid-shrink          ⛔  /* no equivalent */
.fc-scrollgrid-shrink-cushion  ⛔  /* no equivalent */
.fc-scrollgrid-shrink-frame    ⛔  /* no equivalent */
.fc-scrollgrid-sticky-shim     ⛔  /* no equivalent */
.fc-scrollgrid-sync-inner      ⛔  /* no equivalent */
.fc-scrollgrid-sync-table      ⛔  /* no equivalent */
.fc-liquid-hack                ⛔  /* no equivalent */
```
