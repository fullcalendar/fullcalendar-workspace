// See LLM generation strategy in ../README.txt
import React from 'react';
import { CalendarOptions } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import * as svgIcons from '../svgs';

import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'
import interactionPlugin from '@fullcalendar/interaction'

const buttonIconClass = 'w-[1em] h-[1em] text-[1.5em]';
const buttonEffectClass = 'hover:brightness-80 active:brightness-120';
const transparentPressableClass = 'hover:bg-gray-500/10 focus:bg-gray-500/10 active:bg-gray-500/20';
const xxsTextClass = 'text-[0.7rem]/[1.25]';
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600';
const nonBusinessHoursClass = 'bg-gray-500/7';
const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`;
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`;
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`;
const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) bg-(--fc-canvas-color)`;
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`;
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`;
const todayPillClass = (data) => 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-on-tertiary)' + (data.hasNavLink ? ' ' + buttonEffectClass : '');
const pillClass = (data) => 'bg-(--fc-monarch-primary-container) text-(--fc-monarch-on-primary-container)' + (data.hasNavLink ? ' ' + buttonEffectClass : '');
const highlightClass = 'bg-(--fc-monarch-primary-container) opacity-30';
const disabledBgClass = 'bg-gray-500/7';
const borderColorClass = 'border-(--fc-monarch-outline-variant)';
const majorBorderColorClass = 'border-(--fc-monarch-outline)';
const alertBorderColorClass = 'border-(--fc-monarch-error)';
const eventColor = 'var(--fc-monarch-primary)';
const eventContrastColor = 'var(--fc-monarch-on-primary)';
const backgroundEventColor = 'var(--fc-monarch-tertiary)';
const backgroundEventColorClass = 'brightness-115 opacity-15';
const rowItemBaseClass = 'mx-0.5 mb-px rounded-sm';
const rowItemClasses = {
  listItemEventClass: rowItemBaseClass,
  listItemEventColorClass: (data) => [
    'border-4',
    data.isCompact ? 'mx-px' : 'mx-1',
  ],
  listItemEventInnerClass: (data) => data.isCompact ? xxsTextClass : 'text-xs',
  listItemEventTimeClass: 'p-0.5',
  listItemEventTitleClass: 'p-0.5 font-bold',
  rowMoreLinkClass: (data) => [
    rowItemBaseClass,
    transparentPressableClass,
    'p-0.5',
    data.isCompact && 'border border-blue-500',
  ],
  rowMoreLinkInnerClass: (data) => [
    data.isCompact ? xxsTextClass : 'text-xs',
  ],
};
const getWeekNumberBadgeClasses = (data) => [
  'rounded-full h-[1.8em] flex flex-row items-center',
  pillClass({ hasNavLink: data.hasNavLink }),
  data.isCompact ? `${xxsTextClass} px-1` : 'text-sm px-2',
];
const rowWeekNumberClasses = {
  weekNumberClass: (data) => [
    data.isCell
      ? ''
      : 'absolute z-20 ' + (data.isCompact ? 'top-1 start-0.5' : 'top-2 start-1'),
  ],
  weekNumberInnerClass: (data) => data.isCell ? '' : getWeekNumberBadgeClasses(data),
};

export function EventCalendarView(options: CalendarOptions) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, multiMonthPlugin, interactionPlugin]}
      eventColor={eventColor}
      eventContrastColor={eventContrastColor}
      backgroundEventColor={backgroundEventColor}
      className={`border ${borderColorClass} rounded-xl overflow-hidden`}
      tableHeaderClass={(data) => data.isSticky && `bg-(--fc-canvas-color) border-b ${borderColorClass}`}
      popoverClass={`border ${borderColorClass} rounded-lg bg-(--fc-canvas-color) shadow-lg m-2`}
      popoverHeaderClass="px-1 py-1"
      popoverCloseClass={`absolute top-2 end-2 rounded-full w-8 h-8 inline-flex flex-row justify-center items-center ${transparentPressableClass}`}
      popoverBodyClass="p-2 min-w-3xs"
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      fillerClass={(data) => [
        'opacity-50 border',
        data.isHeader ? 'border-transparent' : borderColorClass,
      ]}
      nonBusinessClass={nonBusinessHoursClass}
      highlightClass={highlightClass}
      eventTimeClass="whitespace-nowrap overflow-hidden flex-shrink-1"
      eventTitleClass="whitespace-nowrap overflow-hidden flex-shrink-100"
      backgroundEventColorClass={'bg-(--fc-event-color) ' + backgroundEventColorClass}
      backgroundEventTitleClass={(data) => [
        'm-2 opacity-50 italic',
        data.isCompact ? xxsTextClass : 'text-xs',
      ]}
      listItemEventClass={(data) => [
        'items-center',
        data.isSelected ? 'bg-gray-500/30' : transparentPressableClass,
        (data.isSelected && data.isDragging) && 'shadow-sm',
      ]}
      listItemEventColorClass="rounded-full border-(--fc-event-color)"
      listItemEventInnerClass="flex flex-row items-center"
      blockEventClass={(data) => [
        'relative',
        'group',
        (data.isDragging && !data.isSelected) && 'opacity-75',
        data.isSelected ? (data.isDragging ? 'shadow-lg' : 'shadow-md') : 'focus:shadow-md',
      ]}
      blockEventColorClass={(data) => [
        'absolute z-0 inset-0',
        'bg-(--fc-event-color) print:bg-white',
        'print:border print:border-(--fc-event-color)',
        data.isSelected ? 'brightness-75' : 'group-focus:brightness-75',
      ]}
      blockEventInnerClass="relative z-10 flex text-(--fc-event-contrast-color)"
      rowEventClass={(data) => [
        'mb-px',
        data.isStart ? 'ms-px' : 'ps-2',
        data.isEnd ? 'me-px' : 'pe-2',
      ]}
      rowEventBeforeClass={(data) => data.isStartResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ]}
      rowEventAfterClass={(data) => data.isEndResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ]}
      rowEventColorClass={(data) => [
        data.isStart && 'rounded-s-sm',
        data.isEnd && 'rounded-e-sm',
        (!data.isStart && !data.isEnd)
          ? '[clip-path:polygon(0_50%,6px_0,calc(100%_-_6px)_0,100%_50%,calc(100%_-_6px)_100%,6px_100%)]'
          : !data.isStart
            ? '[clip-path:polygon(0_50%,6px_0,100%_0,100%_100%,6px_100%)]'
            : !data.isEnd
              && '[clip-path:polygon(0_0,calc(100%_-_6px)_0,100%_50%,calc(100%_-_6px)_100%,0_100%)]',
      ]}
      rowEventInnerClass={(data) => [
        'flex-row items-center',
        data.isCompact ? xxsTextClass : 'text-xs',
      ]}
      rowEventTimeClass="p-1 font-bold"
      rowEventTitleClass="p-1"
      columnEventClass="mb-px"
      columnEventBeforeClass={(data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ]}
      columnEventAfterClass={(data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ]}
      columnEventColorClass={(data) => [
        data.isStart && 'rounded-t-sm',
        data.isEnd && 'rounded-b-sm',
        (data.level || data.isDragging) && 'outline outline-(--fc-canvas-color)',
      ]}
      columnEventInnerClass={(data) => [
        data.isCompact ? 'flex-row gap-1' : 'flex-col gap-px',
      ]}
      columnEventTimeClass="p-1 text-xs order-1"
      columnEventTitleClass={(data) => [
        data.isCompact ? xxsTextClass : 'p-1 text-xs',
      ]}
      columnEventTitleSticky={false}
      singleMonthClass={(data) => data.colCount > 1 && 'm-4'}
      singleMonthTitleClass={(data) => [
        data.isSticky && `border-b ${borderColorClass} bg-(--fc-canvas-color)`,
        data.isSticky ? 'py-2' : 'pb-4',
        data.isCompact ? 'text-base' : 'text-lg',
        'text-center font-bold',
      ]}
      dayHeaderRowClass={`border ${borderColorClass}`}
      dayHeaderClass={(data) => [
        data.isDisabled && disabledBgClass,
        'items-center',
      ]}
      dayHeaderInnerClass={(data) => [
        'group pt-2 flex flex-col items-center',
        data.isCompact && xxsTextClass,
      ]}
      dayRowClass={`border ${borderColorClass}`}
      dayCellClass={(data) => [
        data.isMajor ? `border ${majorBorderColorClass}` : `border ${borderColorClass}`,
        data.isDisabled && disabledBgClass,
      ]}
      dayCellTopClass={(data) => [
        'flex flex-row',
        data.isCompact ? 'justify-end' : 'justify-center',
        'min-h-[2px]',
        data.isOther && 'opacity-30',
      ]}
      dayCellTopInnerClass={(data) => [
        'flex flex-row items-center justify-center w-[1.8em] h-[1.8em] rounded-full',
        data.isToday ? todayPillClass({ hasNavLink: data.hasNavLink }) : data.hasNavLink && transparentPressableClass,
        data.hasMonthLabel && 'text-base font-bold',
        data.isCompact ? xxsTextClass : 'text-sm',
        !data.isCompact && 'm-2',
      ]}
      allDayDividerClass={`border-t ${borderColorClass}`}
      dayLaneClass={(data) => [
        data.isMajor ? `border ${majorBorderColorClass}` : `border ${borderColorClass}`,
        data.isDisabled && disabledBgClass,
      ]}
      dayLaneInnerClass={(data) => data.isSimple ? 'm-1' : 'ms-0.5 me-[2.5%]'}
      slotLaneClass={(data) => [
        `border ${borderColorClass}`,
        data.isMinor && 'border-dotted',
      ]}
      listDayClass={`flex flex-row items-start not-last:border-b ${borderColorClass}`}
      listDayHeaderClass="flex flex-row items-center w-40"
      listDayHeaderInnerClass={data => !data.level ? 'm-2 flex flex-row items-center text-lg group' : 'uppercase text-xs hover:underline'}
      listDayEventsClass="flex-grow flex flex-col py-2"
      nowIndicatorLineClass={`-m-px border-1 ${alertBorderColorClass}`}
      nowIndicatorDotClass={`rounded-full w-0 h-0 -mx-[6px] -my-[6px] border-6 ${alertBorderColorClass}`}
      toolbarClass="p-4 items-center gap-3"
      toolbarSectionClass={(data) => [
        'items-center gap-3',
        data.name === 'center' && '-order-1 sm:order-0 w-full sm:w-auto',
      ]}
      toolbarTitleClass="text-xl md:text-2xl font-bold"
      buttons={{
        prev: {
          iconContent: (data) => data.direction === 'ltr'
            ? svgIcons.chevronLeft(buttonIconClass)
            : svgIcons.chevronRight(buttonIconClass),
        },
        next: {
          iconContent: (data) => data.direction === 'ltr'
            ? svgIcons.chevronRight(buttonIconClass)
            : svgIcons.chevronLeft(buttonIconClass),
        },
        prevYear: {
          iconContent: (data) => data.direction === 'ltr'
            ? svgIcons.chevronsLeft(buttonIconClass)
            : svgIcons.chevronsRight(buttonIconClass),
        },
        nextYear: {
          iconContent: (data) => data.direction === 'ltr'
            ? svgIcons.chevronsRight(buttonIconClass)
            : svgIcons.chevronsLeft(buttonIconClass),
        },
      }}
      buttonGroupClass={(data) => [
        'items-center isolate rounded-full',
        data.isViewGroup && 'border border-(--fc-monarch-outline-variant)'
      ]}
      buttonClass={(data) => [
        data.inViewGroup && '-m-px',
        'inline-flex items-center justify-center py-3 text-sm rounded-full',
        data.inGroup && 'relative active:z-20 focus:z-20',
        data.isSelected ? 'z-10' : 'z-0',
        data.isDisabled && `pointer-events-none`,
        data.isIconOnly ? 'px-3' : 'px-5',
        (data.isIconOnly || (data.inViewGroup && !data.isSelected))
          ? transparentPressableClass
          : data.isSelected
            ? (`bg-(--fc-monarch-secondary) text-(--fc-monarch-on-secondary) ${buttonEffectClass}` + (data.isDisabled ? ' opacity-90' : ''))
            : data.isPrimary
              ? (`bg-(--fc-monarch-primary) text-(--fc-monarch-on-primary) ${buttonEffectClass}` + (data.isDisabled ? ' opacity-90' : ''))
              : `border border-(--fc-monarch-outline-variant-original)`
      ]}
      popoverCloseContent={() => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65')}
      dayHeaderContent={data => (
        <>
          {data.weekdayText && (
            <div className={
              'uppercase text-xs opacity-60' +
              (data.hasNavLink ? ' group-hover:opacity-90' : '')
            }>{data.weekdayText}</div>
          )}
          {data.dayNumberText && (
            <div
              className={
                'm-0.5 flex flex-row items-center justify-center text-lg h-[2em]' +
                (data.isToday
                  ? ` w-[2em] rounded-full ${todayPillClass({ hasNavLink: data.hasNavLink })}`
                  : data.hasNavLink
                    ? ` w-[2em] rounded-full ${transparentPressableClass}`
                    : '')
              }
            >{data.dayNumberText}</div>
          )}
        </>
      )}
      listDayHeaderContent={data => !data.level ? (
        <>
          {data.textParts.map((textPart) => (
            textPart.type === 'day' ? (
              <div className={
                'flex flex-row items-center justify-center w-[2em] h-[2em] rounded-full' +
                (data.isToday
                  ? (' ' + pillClass({ hasNavLink: data.hasNavLink }))
                  : (' ' + (data.hasNavLink ? transparentPressableClass : '')))
              }>{textPart.value}</div>
            ) : (
              <div className='whitespace-pre'>{textPart.value}</div>
            )
          ))}
        </>
      ) : (
        data.text
      )}
      {...options}
      views={{
        ...(options.views || {}),
        dayGrid: {
          ...rowItemClasses,
          ...rowWeekNumberClasses,
          dayCellBottomClass: 'min-h-[1px]',
          ...options.views?.dayGrid
        },
        multiMonth: {
          ...rowItemClasses,
          ...rowWeekNumberClasses,
          tableBodyClass: `border ${borderColorClass} rounded-sm`,
          dayHeaderInnerClass: 'mb-2',
          dayCellBottomClass: 'min-h-[1px]',
          ...options.views?.multiMonth
        },
        timeGrid: {
          ...rowItemClasses,
          weekNumberClass: 'items-center justify-end',
          weekNumberInnerClass: (data) => [
            ...getWeekNumberBadgeClasses(data)
          ],
          dayRowClass: 'min-h-12',
          dayCellBottomClass: 'min-h-4',
          allDayHeaderClass: 'justify-end items-center',
          allDayHeaderInnerClass: (data) => [
            'px-2 py-0.5 text-end',
            'whitespace-pre',
            data.isCompact ? xxsTextClass : 'text-sm',
          ],
          columnMoreLinkClass: `mb-px rounded-xs outline outline-(--fc-canvas-color) ${moreLinkBgClass}`,
          columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',
          slotLabelClass: (data) => [
            `border ${borderColorClass}`,
            'w-2 self-end justify-end',
            data.isMinor && 'border-dotted',
          ],
          slotLabelInnerClass: (data) => [
            'ps-2 pe-3 py-0.5 -mt-[1em] text-end',
            'min-h-[3em]',
            data.isCompact ? xxsTextClass : 'text-sm',
          ],
          slotLabelDividerClass: (data) => [
            'border-l',
            data.isHeader ? 'border-transparent' : `border ${borderColorClass}`,
          ],
          ...options.views?.timeGrid
        },
        list: {
          listItemEventClass: 'group rounded-s-xl p-1',
          listItemEventColorClass: 'border-5 mx-2',
          listItemEventInnerClass: 'text-sm',
          listItemEventTimeClass: 'w-40 mx-2',
          listItemEventTitleClass: (data) => [
            'mx-2',
            data.event.url && 'group-hover:underline',
          ],
          noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center`,
          ...options.views?.list
        }
      }}
    />
  );
}
