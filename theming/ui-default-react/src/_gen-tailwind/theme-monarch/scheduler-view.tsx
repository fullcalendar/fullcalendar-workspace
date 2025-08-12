// See LLM generation strategy in ../README.txt
import React from 'react';
import { CalendarOptions } from '@fullcalendar/core';
import { EventCalendarView } from './event-calendar-view.js';
import * as svgIcons from './svgs.js';

import timelinePlugin from '@fullcalendar/timeline'
import resourceDaygridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimegridPlugin from '@fullcalendar/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollgridPlugin from '@fullcalendar/scrollgrid'

const buttonEffectClass = 'hover:brightness-80 active:brightness-120';
const transparentPressableClass = 'hover:bg-gray-500/10 focus:bg-gray-500/10 active:bg-gray-500/20';
const xxsTextClass = 'text-[0.7rem]/[1.25]';
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600';
const borderColorClass = 'border-(--fc-monarch-outline-variant)';
const majorBorderColorClass = 'border-(--fc-monarch-outline)';
const disabledBgClass = 'bg-gray-500/7';
const pillClass = (data: any) => 'bg-(--fc-monarch-primary-container) text-(--fc-monarch-on-primary-container)' + (data.hasNavLink ? ' ' + buttonEffectClass : '');

export function SchedulerView(options: CalendarOptions) {
  return (
    <EventCalendarView
      plugins={[
        timelinePlugin,
        resourceDaygridPlugin,
        resourceTimegridPlugin,
        resourceTimelinePlugin,
        adaptivePlugin,
        scrollgridPlugin,
      ]}
      resourceDayHeaderClass={(data) => [
        data.isMajor ? `border ${majorBorderColorClass}` : `border ${borderColorClass}`,
        data.isDisabled && disabledBgClass,
        'items-center',
      ]}
      resourceDayHeaderInnerClass={(data) => [
        'py-2 flex flex-col',
        data.isCompact ? xxsTextClass : 'text-sm',
      ]}
      resourceAreaHeaderRowClass={`border ${borderColorClass}`}
      resourceAreaHeaderClass={`border ${borderColorClass} items-center`}
      resourceAreaHeaderInnerClass="p-2 text-sm"
      resourceAreaDividerClass={`border-s ${borderColorClass}`}
      resourceAreaRowClass={`border ${borderColorClass}`}
      resourceGroupHeaderClass={disabledBgClass}
      resourceGroupHeaderInnerClass="p-2 text-sm"
      resourceGroupLaneClass={[`border ${borderColorClass}`, disabledBgClass]}
      resourceCellClass={`border ${borderColorClass}`}
      resourceCellInnerClass="p-2 text-sm"
      resourceExpanderClass={[
        'self-center w-6 h-6 flex flex-row items-center justify-center rounded-full text-sm relative start-1',
        transparentPressableClass,
      ]}
      resourceLaneClass={`border ${borderColorClass}`}
      resourceLaneBottomClass={(data) => !data.isCompact && 'pb-3'}
      timelineBottomClass="pb-3"
      resourceExpanderContent={() => svgIcons.chevronRight('w-[1.25em] h-[1.25em] opacity-65')}
      {...options}
      views={{
        ...options.views,
        timeline: {
          rowEventClass: [
            'me-px',
          ],
          rowEventInnerClass: () => [
            'gap-1',
          ],
          rowMoreLinkClass: `me-px p-px ${moreLinkBgClass}`,
          rowMoreLinkInnerClass: 'p-0.5 text-xs',
          slotLabelSticky: '0.5rem',
          slotLabelClass: (data) => (data.level && !data.isTime)
            ? [
              'border border-transparent',
              'justify-start',
            ]
            : [
              `border ${borderColorClass}`,
              'h-2 self-end justify-end',
            ],
          slotLabelInnerClass: (data) => (data.level && !data.isTime)
            ? [
              'px-2 py-1 rounded-full text-sm',
              pillClass({ hasNavLink: data.hasNavLink }),
            ]
            : 'pb-3 -ms-1 text-sm min-w-14',
          slotLabelDividerClass: `border-b ${borderColorClass}`,
          ...options.views?.timeline
        }
      }}
    />
  );
}
