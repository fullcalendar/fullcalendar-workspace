
# FullCalendar Angular Scheduler

FullCalendar Angular Scheduler package, for rendering resource views

## Installation

```sh
npm install \
  @fullcalendar/angular \
  @fullcalendar/angular-scheduler \
  fullcalendar \
  fullcalendar-scheduler \
  temporal-polyfill
```

## Usage

In one of your app's component files:

```ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { FullCalendarModule, CalendarOptions } from "@fullcalendar/angular";
import themePlugin from "@fullcalendar/angular/themes/monarch"; // YOUR THEME
import interactionPlugin from "@fullcalendar/angular/interaction";
import resourceTimelinePlugin from "@fullcalendar/angular-scheduler/resource-timeline";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, FullCalendarModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  calendarOptions: CalendarOptions = {
    plugins: [themePlugin, interactionPlugin, resourceTimelinePlugin],
    initialView: "resourceTimelineWeek",
    schedulerLicenseKey: "YOUR-LICENSE-KEY",
    editable: true,
    events: [
      { id: "1", resourceId: "a", title: "Meeting", start: new Date() },
    ],
    resources: [
      { id: "a", title: "Resource A" },
      { id: "b", title: "Resource B" },
    ],
  };
}
```

Then, add the following stylesheets to your `angular.json`:

```diff
  {
    "projects": {        // ...
      "my-project": {    // ...
        "architect": {   // ...
          "build": {     // ...
            "options": { // ...
              "styles": [
+               "@fullcalendar/angular/skeleton.css", // ALWAYS NEED SKELETON
+               "@fullcalendar/angular/themes/monarch/theme.css", // YOUR THEME
+               "@fullcalendar/angular/themes/monarch/palettes/purple.css", // YOUR THEME'S PALETTE
                "src/styles.css"
              ]
```

Then, in your component's template file, you have access to the `<full-calendar>` tag. You must pass your options into this declaration!

```html
<full-calendar [options]="calendarOptions"></full-calendar>
```

## Plugins

| Import                                              | Provides                                                 |
| --------------------------------------------------- | -------------------------------------------------------- |
| `@fullcalendar/angular-scheduler/resource-timeline` | `resourceTimelineDay`/`Week`/`Month`/`Year` views        |
| `@fullcalendar/angular-scheduler/resource-timegrid` | `resourceTimeGridDay`/`Week` views                       |
| `@fullcalendar/angular-scheduler/resource-daygrid`  | `resourceDayGridDay`/`Week`/`Month` views                |
| `@fullcalendar/angular-scheduler/timeline`          | `timelineDay`/`Week`/`Month`/`Year` views (no resources) |
| `@fullcalendar/angular-scheduler/scrollgrid`        | enhanced scroll-related features for large grids         |
| `@fullcalendar/angular-scheduler/adaptive`          | print-optimized rendering                                |

## Links

- [Angular Documentation](https://fullcalendar.io/docs/angular)
- [Angular Scheduler Documentation](https://fullcalendar.io/docs/angular#fullcalendar-premium)
- [Angular Scheduler Example Project](https://github.com/fullcalendar/fullcalendar-examples/tree/main/angular21-scheduler)
- [Options Reference](https://fullcalendar.io/docs#toc)
