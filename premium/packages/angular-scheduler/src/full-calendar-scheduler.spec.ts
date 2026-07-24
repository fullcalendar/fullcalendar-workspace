import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CalendarOptions,
  FullCalendarComponent,
  FullCalendarModule,
} from '@fullcalendar/angular';
import classicThemePlugin from '@fullcalendar/angular/themes/classic';
import resourceTimeGridPlugin from '@fullcalendar/angular-scheduler/resource-timegrid';
import resourceTimelinePlugin from '@fullcalendar/angular-scheduler/resource-timeline';

const DEFAULT_OPTIONS = {
  schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
};

// Integration test: resource-timeline
// https://github.com/fullcalendar/fullcalendar/issues/7105

@Component({
  template: `
    <full-calendar #calendar [options]="calendarOptions">
      <ng-template #resourceCellContent let-arg>
        <b>{{ arg.resource.title }}</b>
      </ng-template>
    </full-calendar>
  `,
})
class ResourceTimelineHostComponent {
  calendarOptions: CalendarOptions = {
    ...DEFAULT_OPTIONS,
    plugins: [classicThemePlugin, resourceTimelinePlugin],
    initialView: 'resourceTimelineWeek',
    resources: [{ id: 'a', title: 'a' }],
  };

  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;

  removeResource() {
    const resource = this.calendarComponent!.getApi().getResourceById('a')!;
    resource.remove();
  }
}

describe('with resource-timeline view', () => {
  let component: ResourceTimelineHostComponent;
  let fixture: ComponentFixture<ResourceTimelineHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FullCalendarModule],
      declarations: [ResourceTimelineHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceTimelineHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not throw any errors when removing a resource', () => {
    component.removeResource();
    expect(Boolean(fixture)).toBe(true);
  });
});

// Regression test for an Angular-rendered event spanning adjacent view ranges.
// https://github.com/fullcalendar/fullcalendar/issues/8085

@Component({
  template: `
    <full-calendar #calendar [options]="calendarOptions">
      <ng-template #eventContent let-arg>
        <b>{{ arg.timeText }}</b>
        <i>{{ arg.event.title }}</i>
      </ng-template>
    </full-calendar>
  `,
})
class ResourceTimelineCrossRangeEventHostComponent {
  calendarOptions: CalendarOptions = {
    ...DEFAULT_OPTIONS,
    plugins: [classicThemePlugin, resourceTimelinePlugin],
    initialView: 'resourceTimelineDay',
    initialDate: '2024-06-10',
    resources: [
      { id: 'r1', title: 'Resource A' },
    ],
    events: [
      {
        id: 'before',
        resourceId: 'r1',
        title: 'Starts before visible range',
        start: '2024-06-09T20:00:00',
        end: '2024-06-10T05:00:00',
      },
    ],
    eventClass: 'cross-range-event',
  };

  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;
}

describe('with resource-timeline event spanning adjacent view ranges', () => {
  let component: ResourceTimelineCrossRangeEventHostComponent;
  let fixture: ComponentFixture<ResourceTimelineCrossRangeEventHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FullCalendarModule],
      declarations: [ResourceTimelineCrossRangeEventHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceTimelineCrossRangeEventHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('custom-renders after navigating to the previous range and back', () => {
    const calendar = component.calendarComponent!.getApi();

    expect(fixture.nativeElement.querySelector('.cross-range-event b')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.cross-range-event i').textContent)
      .toBe('Starts before visible range');

    calendar.prev();
    expect(fixture.nativeElement.querySelector('.cross-range-event i')).toBeTruthy();

    calendar.next();
    expect(fixture.nativeElement.querySelector('.cross-range-event b')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.cross-range-event i').textContent)
      .toBe('Starts before visible range');
  });
});

// Integration test: resource-timegrid
// https://github.com/fullcalendar/fullcalendar/issues/7182

@Component({
  template: `
    <full-calendar [options]="calendarOptions">
      <ng-template #resourceDayHeaderContent let-arg>
        <b>{{ arg.resource.title }}</b>
      </ng-template>
    </full-calendar>
  `,
})
class ResourceTimeGridHostComponent {
  calendarOptions: CalendarOptions = {
    ...DEFAULT_OPTIONS,
    plugins: [classicThemePlugin, resourceTimeGridPlugin],
    initialView: 'resourceTimeGridDay',
    resources: [{ id: 'a', title: 'a' }],
  };
}

describe('with resource-timegrid view', () => {
  let fixture: ComponentFixture<ResourceTimeGridHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FullCalendarModule],
      declarations: [ResourceTimeGridHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceTimeGridHostComponent);
    fixture.detectChanges();
  });

  it('renders custom label', () => {
    expect(fixture.nativeElement.querySelectorAll('b').length).toBe(1);
  });
});
