import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CalendarOptions,
  FullCalendarComponent,
  FullCalendarModule,
} from '@fullcalendar/angular';
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
    plugins: [resourceTimelinePlugin],
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
    plugins: [resourceTimeGridPlugin],
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
