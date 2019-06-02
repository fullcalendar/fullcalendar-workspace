declare module "@fullcalendar/timeline/util/ScrollerCanvas" {
    export { ScrollerCanvas as default, ScrollerCanvas };

    class ScrollerCanvas {
        el: HTMLElement;
        contentEl: HTMLElement;
        bgEl: HTMLElement;
        gutters: any;
        width: any;
        minWidth: any;
        constructor();
        setGutters(gutters: any): void;
        setWidth(width: any): void;
        setMinWidth(minWidth: any): void;
        clearWidth(): void;
        updateSize(): void;
    }
}

declare module "@fullcalendar/timeline/util/EnhancedScroller" {
    import { ScrollComponent, EmitterInterface } from "@fullcalendar/core";
    import ScrollerCanvas from "@fullcalendar/timeline/util/ScrollerCanvas";
    export { EnhancedScroller as default, EnhancedScroller };
    class EnhancedScroller extends ScrollComponent {
        on: EmitterInterface['on'];
        one: EmitterInterface['one'];
        off: EmitterInterface['off'];
        trigger: EmitterInterface['trigger'];
        triggerWith: EmitterInterface['triggerWith'];
        hasHandlers: EmitterInterface['hasHandlers'];
        canvas: ScrollerCanvas;
        isScrolling: boolean;
        isTouching: boolean;
        isMoving: boolean;
        isTouchScrollEnabled: boolean;
        preventTouchScrollHandler: any;
        requestMovingEnd: any;
        constructor(overflowX: string, overflowY: string);
        destroy(): void;
        disableTouchScroll(): void;
        enableTouchScroll(): void;
        bindPreventTouchScroll(): void;
        unbindPreventTouchScroll(): void;
        bindHandlers(): void;
        unbindHandlers(): void;
        reportScroll: () => void;
        reportScrollStart: () => void;
        reportMovingEnd(): void;
        reportScrollEnd(): void;
        reportTouchStart: () => void;
        reportTouchEnd: () => void;
        getScrollLeft(): number;
        setScrollLeft(val: any): void;
        getScrollFromLeft(): number;
    }
}

declare module "@fullcalendar/timeline/util/ClippedScroller" {
    import { ScrollbarWidths } from "@fullcalendar/core";
    import EnhancedScroller from "@fullcalendar/timeline/util/EnhancedScroller";
    export { ClippedScroller as default, ClippedScroller };
    class ClippedScroller {
        el: HTMLElement;
        enhancedScroll: EnhancedScroller;
        isHScrollbarsClipped: boolean;
        isVScrollbarsClipped: boolean;
        constructor(overflowX: string, overflowY: string, parentEl: HTMLElement);
        destroy(): void;
        updateSize(): void;
        setHeight(height: number | string): void;
        getScrollbarWidths(): ScrollbarWidths;
    }
}

declare module "@fullcalendar/timeline/util/ScrollJoiner" {
    import ClippedScroller from "@fullcalendar/timeline/util/ClippedScroller";
    export { ScrollJoiner as default, ScrollJoiner };
    class ScrollJoiner {
        axis: any;
        scrollers: ClippedScroller[];
        masterScroller: ClippedScroller;
        constructor(axis: any, scrollers: ClippedScroller[]);
        initScroller(scroller: ClippedScroller): void;
        assignMasterScroller(scroller: any): void;
        unassignMasterScroller(): void;
        update(): void;
    }
}

declare module "@fullcalendar/timeline/HeaderBodyLayout" {
    import ClippedScroller from "@fullcalendar/timeline/util/ClippedScroller";
    import ScrollJoiner from "@fullcalendar/timeline/util/ScrollJoiner";
    export { HeaderBodyLayout as default, HeaderBodyLayout };
    class HeaderBodyLayout {
        headerScroller: ClippedScroller;
        bodyScroller: ClippedScroller;
        scrollJoiner: ScrollJoiner;
        constructor(headerContainerEl: any, bodyContainerEl: any, verticalScroll: any);
        destroy(): void;
        setHeight(totalHeight: any, isAuto: any): void;
        queryHeadHeight(): number;
    }
}

declare module "@fullcalendar/timeline/timeline-date-profile" {
    import { Duration, View, DateProfile, DateMarker, DateEnv, DateRange } from "@fullcalendar/core";
    export interface TimelineDateProfile {
        labelInterval: Duration;
        slotDuration: Duration;
        headerFormats: any;
        isTimeScale: boolean;
        largeUnit: string;
        emphasizeWeeks: boolean;
        snapDuration: Duration;
        snapsPerSlot: number;
        normalizedRange: DateRange;
        timeWindowMs: number;
        slotDates: DateMarker[];
        isWeekStarts: boolean[];
        snapDiffToIndex: number[];
        snapIndexToDiff: number[];
        snapCnt: number;
        slotCnt: number;
        cellRows: TimelineHeaderCell[][];
    }
    export interface TimelineHeaderCell {
        text: string;
        spanHtml: string;
        date: DateMarker;
        colspan: number;
        isWeekStart: boolean;
    }
    export function buildTimelineDateProfile(dateProfile: DateProfile, view: View): TimelineDateProfile;
    export function normalizeDate(date: DateMarker, tDateProfile: TimelineDateProfile, dateEnv: DateEnv): DateMarker;
    export function normalizeRange(range: DateRange, tDateProfile: TimelineDateProfile, dateEnv: DateEnv): DateRange;
    export function isValidDate(date: DateMarker, tDateProfile: TimelineDateProfile, dateProfile: DateProfile, view: View): boolean;
}

declare module "@fullcalendar/timeline/TimelineHeader" {
    import { Component, ComponentContext, DateProfile } from "@fullcalendar/core";
    import { TimelineDateProfile } from "@fullcalendar/timeline/timeline-date-profile";
    export interface TimelineHeaderProps {
        dateProfile: DateProfile;
        tDateProfile: TimelineDateProfile;
    }
    export { TimelineHeader as default, TimelineHeader };
    class TimelineHeader extends Component<TimelineHeaderProps> {
        tableEl: HTMLElement;
        slatColEls: HTMLElement[];
        innerEls: HTMLElement[];
        constructor(context: ComponentContext, parentEl: HTMLElement);
        destroy(): void;
        render(props: TimelineHeaderProps): void;
        renderDates(tDateProfile: TimelineDateProfile): void;
    }
}

declare module "@fullcalendar/timeline/TimelineSlats" {
    import { PositionCache, Component, ComponentContext, DateProfile } from "@fullcalendar/core";
    import { TimelineDateProfile } from "@fullcalendar/timeline/timeline-date-profile";
    export interface TimelineSlatsProps {
        dateProfile: DateProfile;
        tDateProfile: TimelineDateProfile;
    }
    export { TimelineSlats as default, TimelineSlats };
    class TimelineSlats extends Component<TimelineSlatsProps> {
        el: HTMLElement;
        slatColEls: HTMLElement[];
        slatEls: HTMLElement[];
        outerCoordCache: PositionCache;
        innerCoordCache: PositionCache;
        constructor(context: ComponentContext, parentEl: HTMLElement);
        destroy(): void;
        render(props: TimelineSlatsProps): void;
        renderDates(tDateProfile: TimelineDateProfile): void;
        slatCellHtml(date: any, isEm: any, tDateProfile: TimelineDateProfile): string;
        updateSize(): void;
        positionToHit(leftPosition: any): {
            dateSpan: {
                range: {
                    start: Date;
                    end: Date;
                };
                allDay: boolean;
            };
            dayEl: HTMLElement;
            left: any;
            right: any;
        };
    }
}

declare module "@fullcalendar/timeline/TimelineNowIndicator" {
    export { TimelineNowIndicator as default, TimelineNowIndicator };

    class TimelineNowIndicator {
        headParent: HTMLElement;
        bodyParent: HTMLElement;
        arrowEl: HTMLElement;
        lineEl: HTMLElement;
        constructor(headParent: HTMLElement, bodyParent: HTMLElement);
        render(coord: number, isRtl: boolean): void;
        unrender(): void;
    }
}

declare module "@fullcalendar/timeline/util/StickyScroller" {
    import { Rect, Point } from "@fullcalendar/core";
    import EnhancedScroller from "@fullcalendar/timeline/util/EnhancedScroller";
    interface ElementGeom {
        parentBound: Rect;
        naturalBound: Rect | null;
        elWidth: number;
        elHeight: number;
        computedTextAlign: string;
        intendedTextAlign: string;
    }
    export { StickyScroller as default, StickyScroller };
    class StickyScroller {
        scroller: EnhancedScroller;
        usingRelative: boolean | null;
        constructor(scroller: EnhancedScroller, isRtl: boolean, isVertical: boolean);
        destroy(): void;
        updateSize: () => void;
        queryElGeoms(els: HTMLElement[]): ElementGeom[];
        computeElDestinations(elGeoms: ElementGeom[], viewportWidth: number): Point[];
    }
}

declare module "@fullcalendar/timeline/TimeAxis" {
    import { DateProfile, DateMarker, Component, ComponentContext } from "@fullcalendar/core";
    import HeaderBodyLayout from "@fullcalendar/timeline/HeaderBodyLayout";
    import TimelineHeader from "@fullcalendar/timeline/TimelineHeader";
    import TimelineSlats from "@fullcalendar/timeline/TimelineSlats";
    import { TimelineDateProfile } from "@fullcalendar/timeline/timeline-date-profile";
    import TimelineNowIndicator from "@fullcalendar/timeline/TimelineNowIndicator";
    import StickyScroller from "@fullcalendar/timeline/util/StickyScroller";
    export interface TimeAxisProps {
        dateProfile: DateProfile;
    }
    export { TimeAxis as default, TimeAxis };
    class TimeAxis extends Component<TimeAxisProps> {
        layout: HeaderBodyLayout;
        header: TimelineHeader;
        slats: TimelineSlats;
        nowIndicator: TimelineNowIndicator;
        headStickyScroller: StickyScroller;
        bodyStickyScroller: StickyScroller;
        tDateProfile: TimelineDateProfile;
        constructor(context: ComponentContext, headerContainerEl: any, bodyContainerEl: any);
        destroy(): void;
        render(props: TimeAxisProps): void;
        getNowIndicatorUnit(dateProfile: DateProfile): string;
        renderNowIndicator(date: any): void;
        unrenderNowIndicator(): void;
        updateSize(isResize: any, totalHeight: any, isAuto: any): void;
        updateStickyScrollers(): void;
        computeSlotWidth(): any;
        computeDefaultSlotWidth(tDateProfile: any): number;
        applySlotWidth(slotWidth: number | string): void;
        computeDateSnapCoverage(date: DateMarker): number;
        dateToCoord(date: any): any;
        rangeToCoords(range: any): {
            right: any;
            left: any;
        };
        computeDateScroll(timeMs: any): {
            left: number;
        };
        queryDateScroll(): {
            left: number;
        };
        applyDateScroll(scroll: any): void;
    }
}

declare module "@fullcalendar/timeline/TimelineLaneEventRenderer" {
    import { FgEventRenderer, Seg, ComponentContext } from "@fullcalendar/core";
    import TimeAxis from "@fullcalendar/timeline/TimeAxis";
    export { TimelineLaneEventRenderer as default, TimelineLaneEventRenderer };
    class TimelineLaneEventRenderer extends FgEventRenderer {
        timeAxis: TimeAxis;
        masterContainerEl: HTMLElement;
        el: HTMLElement;
        constructor(context: ComponentContext, masterContainerEl: HTMLElement, timeAxis: TimeAxis);
        renderSegHtml(seg: any, mirrorInfo: any): string;
        computeDisplayEventTime(): boolean;
        computeDisplayEventEnd(): boolean;
        computeEventTimeFormat(): {
            hour: string;
            minute: string;
            omitZeroMinute: boolean;
            meridiem: string;
        };
        attachSegs(segs: Seg[], mirrorInfo: any): void;
        detachSegs(segs: Seg[]): void;
        computeSegSizes(segs: Seg[]): void;
        assignSegSizes(segs: Seg[]): void;
        buildSegLevels(segs: any): any[];
    }
}

declare module "@fullcalendar/timeline/TimelineLaneFillRenderer" {
    import { FillRenderer, ComponentContext, Seg } from "@fullcalendar/core";
    import TimeAxis from "@fullcalendar/timeline/TimeAxis";
    export { TimelineLaneFillRenderer as default, TimelineLaneFillRenderer };
    class TimelineLaneFillRenderer extends FillRenderer {
        timeAxis: TimeAxis;
        masterContainerEl: HTMLElement;
        constructor(context: ComponentContext, masterContainerEl: HTMLElement, timeAxis: TimeAxis);
        attachSegs(type: any, segs: any): HTMLElement[];
        computeSegSizes(segs: Seg[]): void;
        assignSegSizes(segs: Seg[]): void;
    }
}

declare module "@fullcalendar/timeline/TimelineLane" {
    import { Duration, EventStore, EventUiHash, DateMarker, DateSpan, EventInteractionState, EventSegUiInteractionState, DateComponent, ComponentContext, Seg, DateProfile } from "@fullcalendar/core";
    import TimeAxis from "@fullcalendar/timeline/TimeAxis";
    export interface TimelineLaneSeg extends Seg {
        start: DateMarker;
        end: DateMarker;
    }
    export interface TimelineLaneProps {
        dateProfile: DateProfile;
        nextDayThreshold: Duration;
        businessHours: EventStore | null;
        eventStore: EventStore | null;
        eventUiBases: EventUiHash;
        dateSelection: DateSpan | null;
        eventSelection: string;
        eventDrag: EventInteractionState | null;
        eventResize: EventInteractionState | null;
    }
    export { TimelineLane as default, TimelineLane };
    class TimelineLane extends DateComponent<TimelineLaneProps> {
        timeAxis: TimeAxis;
        private slicer;
        private renderBusinessHours;
        private renderDateSelection;
        private renderBgEvents;
        private renderFgEvents;
        private renderEventSelection;
        private renderEventDrag;
        private renderEventResize;
        constructor(context: ComponentContext, fgContainerEl: HTMLElement, bgContainerEl: HTMLElement, timeAxis: TimeAxis);
        render(props: TimelineLaneProps): void;
        destroy(): void;
        _renderEventDrag(state: EventSegUiInteractionState): void;
        _unrenderEventDrag(state: EventSegUiInteractionState): void;
        _renderEventResize(state: EventSegUiInteractionState): void;
        _unrenderEventResize(state: EventSegUiInteractionState): void;
        updateSize(isResize: boolean): void;
    }
}

declare module "@fullcalendar/timeline/TimelineView" {
    import { Hit, View, ViewProps, ComponentContext, ViewSpec, DateProfileGenerator, DateProfile } from "@fullcalendar/core";
    import TimeAxis from "@fullcalendar/timeline/TimeAxis";
    import TimelineLane from "@fullcalendar/timeline/TimelineLane";
    export { TimelineView as default, TimelineView };
    class TimelineView extends View {
        timeAxis: TimeAxis;
        lane: TimelineLane;
        constructor(context: ComponentContext, viewSpec: ViewSpec, dateProfileGenerator: DateProfileGenerator, parentEl: HTMLElement);
        destroy(): void;
        renderSkeletonHtml(): string;
        render(props: ViewProps): void;
        updateSize(isResize: any, totalHeight: any, isAuto: any): void;
        getNowIndicatorUnit(dateProfile: DateProfile): string;
        renderNowIndicator(date: any): void;
        unrenderNowIndicator(): void;
        computeDateScroll(timeMs: number): {
            left: number;
        };
        applyScroll(scroll: any, isResize: any): void;
        applyDateScroll(scroll: any): void;
        queryScroll(): {
            top: number;
            left: number;
        };
        buildPositionCaches(): void;
        queryHit(positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit;
    }
}

declare module "@fullcalendar/timeline" {
    import TimelineView from "@fullcalendar/timeline/TimelineView";
    export { TimelineView };
    export { default as TimelineLane } from "@fullcalendar/timeline/TimelineLane";
    export { default as ScrollJoiner } from "@fullcalendar/timeline/util/ScrollJoiner";
    export { default as StickyScroller } from "@fullcalendar/timeline/util/StickyScroller";
    export { default as TimeAxis } from "@fullcalendar/timeline/TimeAxis";
    export { default as HeaderBodyLayout } from "@fullcalendar/timeline/HeaderBodyLayout";
    const _default_4: import("@fullcalendar/core").PluginDef;
    export default _default_4;
}