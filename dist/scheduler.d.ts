declare module 'fullcalendar-scheduler/src/structs/resource' {
	import { ConstraintInput, AllowFunc, EventStore, Calendar, EventUi, BusinessHoursInput } from 'fullcalendar';
	export interface ResourceInput {
	    id?: string;
	    parentId?: string;
	    children?: ResourceInput[];
	    title?: string;
	    businessHours?: BusinessHoursInput;
	    eventEditable?: boolean;
	    eventStartEditable?: boolean;
	    eventDurationEditable?: boolean;
	    eventConstraint?: ConstraintInput;
	    eventOverlap?: boolean;
	    eventAllow?: AllowFunc;
	    eventClassName?: string[] | string;
	    eventClassNames?: string[] | string;
	    eventBackgroundColor?: string;
	    eventBorderColor?: string;
	    eventTextColor?: string;
	    eventColor?: string;
	    extendedProps?: {
	        [extendedProp: string]: any;
	    };
	    [otherProp: string]: any;
	}
	export interface Resource {
	    id: string;
	    parentId: string;
	    title: string;
	    businessHours: EventStore | null;
	    ui: EventUi;
	    extendedProps: {
	        [extendedProp: string]: any;
	    };
	}
	export type ResourceHash = {
	    [resourceId: string]: Resource;
	};
	export function parseResource(input: ResourceInput, parentId: string, store: ResourceHash, calendar: Calendar): Resource;
	export function getPublicId(id: string): string;

}
declare module 'fullcalendar-scheduler/src/resource-sources/resource-func' {
	import { ResourceSourceError } from 'fullcalendar-scheduler/src/structs/resource-source';
	import { ResourceInput } from 'fullcalendar-scheduler/src/structs/resource';
	export type ResourceFunc = (arg: {
	    start: Date;
	    end: Date;
	    timeZone: string;
	}, successCallback: (events: ResourceInput[]) => void, failureCallback: (errorObj: ResourceSourceError) => void) => any;

}
declare module 'fullcalendar-scheduler/src/structs/resource-source' {
	import { DateRange, Calendar } from 'fullcalendar';
	import { ResourceInput } from 'fullcalendar-scheduler/src/structs/resource';
	import { ResourceFunc } from 'fullcalendar-scheduler/src/resource-sources/resource-func';
	export type ResourceSourceError = {
	    message: string;
	    response?: any;
	    [otherProp: string]: any;
	};
	export type ResourceFetcher = (arg: {
	    resourceSource: ResourceSource;
	    calendar: Calendar;
	    range: DateRange | null;
	}, success: (res: {
	    rawResources: ResourceInput[];
	    response?: any;
	}) => void, failure: (error: ResourceSourceError) => void) => void;
	export interface ExtendedResourceSourceInput {
	    id?: string;
	    resources?: ResourceInput[];
	    url?: string;
	    method?: string;
	    extraParams?: object | (() => object);
	}
	export type ResourceSourceInput = ExtendedResourceSourceInput | ResourceFunc | string;
	export interface ResourceSource {
	    sourceId: string;
	    sourceDefId: number;
	    meta: any;
	    publicId: string;
	    isFetching: boolean;
	    latestFetchId: string;
	    fetchRange: DateRange | null;
	}
	export interface ResourceSourceDef {
	    ignoreRange?: boolean;
	    parseMeta: (raw: ResourceSourceInput) => object | null;
	    fetch: ResourceFetcher;
	}
	export function registerResourceSourceDef(def: ResourceSourceDef): void;
	export function getResourceSourceDef(id: number): ResourceSourceDef;
	export function doesSourceIgnoreRange(source: ResourceSource): boolean;
	export function parseResourceSource(input: ResourceSourceInput): ResourceSource;

}
declare module 'fullcalendar-scheduler/src/reducers/resourceSource' {
	import { Calendar, DateProfile } from 'fullcalendar';
	import { ResourceSource } from 'fullcalendar-scheduler/src/structs/resource-source';
	import { ResourceAction } from 'fullcalendar-scheduler/src/reducers/resources';
	export default function (source: ResourceSource | undefined, action: ResourceAction, dateProfile: DateProfile, calendar: Calendar): ResourceSource | null;

}
declare module 'fullcalendar-scheduler/src/reducers/resourceStore' {
	import { Calendar } from 'fullcalendar';
	import { ResourceAction } from 'fullcalendar-scheduler/src/reducers/resources';
	import { ResourceHash } from 'fullcalendar-scheduler/src/structs/resource';
	import { ResourceSource } from 'fullcalendar-scheduler/src/structs/resource-source';
	export default function (store: ResourceHash | undefined, action: ResourceAction, source: ResourceSource, calendar: Calendar): ResourceHash;

}
declare module 'fullcalendar-scheduler/src/reducers/resources' {
	/// <reference path="../../fullcalendar/dist/fullcalendar.d.ts" />
	import { Calendar, CalendarState, Action, DateRange } from 'fullcalendar';
	import { ResourceSource, ResourceSourceError } from 'fullcalendar-scheduler/src/structs/resource-source';
	import { ResourceHash, ResourceInput } from 'fullcalendar-scheduler/src/structs/resource';
	import { ResourceEntityExpansions } from 'fullcalendar-scheduler/src/reducers/resourceEntityExpansions'; module 'fullcalendar/src/reducers/types' {
	    interface CalendarState {
	        resourceSource: ResourceSource | null;
	        resourceStore: ResourceHash;
	        resourceEntityExpansions: ResourceEntityExpansions;
	    }
	} module 'fullcalendar/Calendar' {
	    interface Default {
	        dispatch(action: ResourceAction): any;
	    }
	}
	export type ResourceAction = Action | {
	    type: 'FETCH_RESOURCE';
	} | {
	    type: 'RECEIVE_RESOURCES';
	    rawResources: ResourceInput[];
	    fetchId: string;
	    fetchRange: DateRange | null;
	} | {
	    type: 'RECEIVE_RESOURCE_ERROR';
	    error: ResourceSourceError;
	    fetchId: string;
	    fetchRange: DateRange | null;
	} | {
	    type: 'ADD_RESOURCE';
	    resourceHash: ResourceHash;
	} | // use a hash because needs to accept children
	{
	    type: 'REMOVE_RESOURCE';
	    resourceId: string;
	} | {
	    type: 'SET_RESOURCE_PROP';
	    resourceId: string;
	    propName: string;
	    propValue: any;
	} | {
	    type: 'SET_RESOURCE_ENTITY_EXPANDED';
	    id: string;
	    isExpanded: boolean;
	} | {
	    type: 'RESET_RESOURCES';
	} | {
	    type: 'REFETCH_RESOURCES';
	};
	export default function (state: CalendarState, action: ResourceAction, calendar: Calendar): {
	    resourceSource: ResourceSource;
	    resourceStore: ResourceHash;
	    resourceEntityExpansions: ResourceEntityExpansions;
	    eventSources: import("fullcalendar/src/structs/event-source").EventSourceHash;
	    eventSourceLoadingLevel: number;
	    loadingLevel: number;
	    viewType: string;
	    dateProfile: import("fullcalendar").DateProfile;
	    eventStore: import("fullcalendar").EventStore;
	    dateSelection: import("fullcalendar").DateSpan;
	    eventSelection: string;
	    eventDrag: import("fullcalendar").EventInteractionState;
	    eventResize: import("fullcalendar").EventInteractionState;
	};

}
declare module 'fullcalendar-scheduler/src/reducers/resourceEntityExpansions' {
	import { ResourceAction } from 'fullcalendar-scheduler/src/reducers/resources';
	export type ResourceEntityExpansions = {
	    [id: string]: boolean;
	};
	export function reduceResourceEntityExpansions(expansions: ResourceEntityExpansions, action: ResourceAction): ResourceEntityExpansions;

}
declare module 'fullcalendar-scheduler/src/View' {
	import { View, ViewProps, ViewSpec, ViewPropsTransformer, CalendarComponentProps, EventUi, EventUiHash, EventDefHash, EventStore, DateRange } from 'fullcalendar';
	import { ResourceHash } from 'fullcalendar-scheduler/src/structs/resource';
	import { ResourceEntityExpansions } from 'fullcalendar-scheduler/src/reducers/resourceEntityExpansions';
	export interface ResourceViewProps extends ViewProps {
	    resourceStore: ResourceHash;
	    resourceEntityExpansions: ResourceEntityExpansions;
	}
	export class ResourceDataAdder implements ViewPropsTransformer {
	    filterResources: typeof filterResources;
	    transform(viewProps: ViewProps, viewSpec: ViewSpec, calendarProps: CalendarComponentProps, view: View): {
	        resourceStore: ResourceHash;
	        resourceEntityExpansions: ResourceEntityExpansions;
	    };
	} function filterResources(resourceStore: ResourceHash, doFilterResourcesWithEvents: boolean, eventStore: EventStore, activeRange: DateRange): ResourceHash;
	export class ResourceEventConfigAdder implements ViewPropsTransformer {
	    buildResourceEventUis: typeof buildResourceEventUis;
	    injectResourceEventUis: typeof injectResourceEventUis;
	    transform(viewProps: ViewProps, viewSpec: ViewSpec, calendarProps: CalendarComponentProps): {
	        eventUiBases: {
	            [key: string]: EventUi;
	        };
	    };
	} function buildResourceEventUis(resourceStore: ResourceHash): {
	    [key: string]: EventUi;
	}; function injectResourceEventUis(eventUiBases: EventUiHash, eventDefs: EventDefHash, resourceEventUis: EventUiHash): {
	    [key: string]: EventUi;
	};
	export {};

}
declare module 'fullcalendar-scheduler/src/structs/event' {
	import { EventDef } from 'fullcalendar'; module 'fullcalendar/src/structs/event' {
	    interface EventDef {
	        resourceIds: string[];
	        resourceEditable: boolean;
	    }
	}
	export function parseEventDef(def: EventDef, props: any, leftovers: any): void;

}
declare module 'fullcalendar-scheduler/src/EventDragging' {
	import { EventMutation, Hit, EventDef, Calendar } from 'fullcalendar'; module 'fullcalendar/src/structs/event-mutation' {
	    interface EventMutation {
	        resourceMutation?: {
	            matchResourceId: string;
	            setResourceId: string;
	        };
	    }
	}
	export function massageEventDragMutation(eventMutation: EventMutation, hit0: Hit, hit1: Hit): void;
	export function applyEventDefMutation(eventDef: EventDef, mutation: EventMutation, calendar: Calendar): void;
	export function computeResourceEditable(eventDef: EventDef, calendar: Calendar): boolean;

}
declare module 'fullcalendar-scheduler/src/DateSelecting' {
	import { Hit } from 'fullcalendar';
	export function transformDateSelectionJoin(hit0: Hit, hit1: Hit): false | {
	    resourceId: any;
	};

}
declare module 'fullcalendar-scheduler/src/api/ResourceApi' {
	import { Calendar, EventApi } from 'fullcalendar';
	import { Resource } from 'fullcalendar-scheduler/src/structs/resource';
	export default class ResourceApi {
	    _calendar: Calendar;
	    _resource: Resource;
	    constructor(calendar: Calendar, rawResource: Resource);
	    setProp(name: string, value: any): void;
	    remove(): void;
	    getParent(): ResourceApi | null;
	    getChildren(): ResourceApi[];
	    getEvents(): EventApi[];
	    readonly id: string;
	    readonly title: string;
	    readonly extendedProps: any;
	}

}
declare module 'fullcalendar-scheduler/src/Calendar' {
	import { DateSpan, Calendar } from 'fullcalendar';
	import ResourceApi from 'fullcalendar-scheduler/src/api/ResourceApi';
	import { ResourceInput } from 'fullcalendar-scheduler/src/structs/resource'; module 'fullcalendar/Calendar' {
	    interface DatePointApi {
	        resource?: ResourceApi;
	    }
	    interface DateSpanApi {
	        resource?: ResourceApi;
	    }
	    interface Default {
	        addResource(input: ResourceInput): ResourceApi;
	        getResourceById(id: string): ResourceApi | null;
	        getResources(): ResourceApi[];
	        getTopLevelResources(): ResourceApi[];
	        rerenderResources(): void;
	        refetchResources(): void;
	    }
	}
	export function transformDatePoint(dateSpan: DateSpan, calendar: Calendar): {
	    resource: ResourceApi;
	} | {
	    resource?: undefined;
	};
	export function transformDateSpan(dateSpan: DateSpan, calendar: Calendar): {
	    resource: ResourceApi;
	} | {
	    resource?: undefined;
	};

}
declare module 'fullcalendar-scheduler/src/common/ResourceSplitter' {
	import { Splitter, SplittableProps, DateSpan, EventDef } from 'fullcalendar';
	import { ResourceHash } from 'fullcalendar-scheduler/src/structs/resource';
	export interface SplittableResourceProps extends SplittableProps {
	    resourceStore: ResourceHash;
	}
	export default class ResourceSplitter extends Splitter<SplittableResourceProps> {
	    getKeyInfo(props: SplittableResourceProps): {
	        '': {};
	    };
	    getKeysForDateSpan(dateSpan: DateSpan): string[];
	    getKeysForEventDef(eventDef: EventDef): string[];
	}

}
declare module 'fullcalendar-scheduler/src/validation' {
	import { SplittableProps, Calendar } from 'fullcalendar';
	export function isPropsValidWithResources(props: SplittableProps, calendar: Calendar): boolean;

}
declare module 'fullcalendar-scheduler/src/ExternalElementDragging' {
	import { DateSpan } from 'fullcalendar';
	export function transformExternalDef(dateSpan: DateSpan): {
	    resourceId: any;
	} | {
	    resourceId?: undefined;
	};

}
declare module 'fullcalendar-scheduler/src/EventResizing' {
	import { Hit } from 'fullcalendar';
	export function transformEventResizeJoin(hit0: Hit, hit1: Hit): false | object;

}
declare module 'fullcalendar-scheduler/src/api/EventApi' {
	import ResourceApi from 'fullcalendar-scheduler/src/api/ResourceApi'; module 'fullcalendar/EventApi' {
	    interface Default {
	        getResources: () => ResourceApi[];
	    }
	}

}
declare module 'fullcalendar-scheduler/src/license' {
	import { Calendar } from 'fullcalendar';
	export function injectLicenseWarning(containerEl: HTMLElement, calendar: Calendar): void;

}
declare module 'fullcalendar-scheduler/src/util/ScrollerCanvas' {
	export default class ScrollerCanvas {
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
declare module 'fullcalendar-scheduler/src/util/EnhancedScroller' {
	import { ScrollComponent, EmitterInterface } from 'fullcalendar';
	import ScrollerCanvas from 'fullcalendar-scheduler/src/util/ScrollerCanvas';
	export default class EnhancedScroller extends ScrollComponent {
	    on: EmitterInterface['on'];
	    one: EmitterInterface['one'];
	    off: EmitterInterface['off'];
	    trigger: EmitterInterface['trigger'];
	    triggerWith: EmitterInterface['triggerWith'];
	    hasHandlers: EmitterInterface['hasHandlers'];
	    canvas: ScrollerCanvas;
	    isScrolling: boolean;
	    isTouching: boolean;
	    isTouchedEver: boolean;
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
declare module 'fullcalendar-scheduler/src/util/ClippedScroller' {
	import { ScrollbarWidths } from 'fullcalendar';
	import EnhancedScroller from 'fullcalendar-scheduler/src/util/EnhancedScroller';
	export default class ClippedScroller {
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
declare module 'fullcalendar-scheduler/src/util/ScrollJoiner' {
	import ClippedScroller from 'fullcalendar-scheduler/src/util/ClippedScroller';
	export default class ScrollJoiner {
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
declare module 'fullcalendar-scheduler/src/timeline/HeaderBodyLayout' {
	import ClippedScroller from 'fullcalendar-scheduler/src/util/ClippedScroller';
	import ScrollJoiner from 'fullcalendar-scheduler/src/util/ScrollJoiner';
	export default class HeaderBodyLayout {
	    headerScroller: ClippedScroller;
	    bodyScroller: ClippedScroller;
	    scrollJoiner: ScrollJoiner;
	    constructor(headerContainerEl: any, bodyContainerEl: any, verticalScroll: any);
	    destroy(): void;
	    setHeight(totalHeight: any, isAuto: any): void;
	    queryHeadHeight(): number;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/timeline-date-profile' {
	import { Duration, View, DateProfile, DateMarker, DateEnv, DateRange } from 'fullcalendar';
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
declare module 'fullcalendar-scheduler/src/timeline/TimelineHeader' {
	import { Component, ComponentContext, DateProfile } from 'fullcalendar';
	import { TimelineDateProfile } from 'fullcalendar-scheduler/src/timeline/timeline-date-profile';
	export interface TimelineHeaderProps {
	    dateProfile: DateProfile;
	    tDateProfile: TimelineDateProfile;
	}
	export default class TimelineHeader extends Component<TimelineHeaderProps> {
	    tableEl: HTMLElement;
	    slatColEls: HTMLElement[];
	    innerEls: HTMLElement[];
	    constructor(context: ComponentContext, parentEl: HTMLElement);
	    destroy(): void;
	    render(props: TimelineHeaderProps): void;
	    renderDates(tDateProfile: TimelineDateProfile): void;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/TimelineSlats' {
	import { PositionCache, Component, ComponentContext, DateProfile } from 'fullcalendar';
	import { TimelineDateProfile } from 'fullcalendar-scheduler/src/timeline/timeline-date-profile';
	export interface TimelineSlatsProps {
	    dateProfile: DateProfile;
	    tDateProfile: TimelineDateProfile;
	}
	export default class TimelineSlats extends Component<TimelineSlatsProps> {
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
declare module 'fullcalendar-scheduler/src/timeline/TimelineNowIndicator' {
	export default class TimelineNowIndicator {
	    headParent: HTMLElement;
	    bodyParent: HTMLElement;
	    arrowEl: HTMLElement;
	    lineEl: HTMLElement;
	    constructor(headParent: HTMLElement, bodyParent: HTMLElement);
	    render(coord: number, isRtl: boolean): void;
	    unrender(): void;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/TimeAxis' {
	import { DateProfile, DateMarker, Component, ComponentContext } from 'fullcalendar';
	import HeaderBodyLayout from 'fullcalendar-scheduler/src/timeline/HeaderBodyLayout';
	import TimelineHeader from 'fullcalendar-scheduler/src/timeline/TimelineHeader';
	import TimelineSlats from 'fullcalendar-scheduler/src/timeline/TimelineSlats';
	import { TimelineDateProfile } from 'fullcalendar-scheduler/src/timeline/timeline-date-profile';
	import TimelineNowIndicator from 'fullcalendar-scheduler/src/timeline/TimelineNowIndicator';
	export interface TimeAxisProps {
	    dateProfile: DateProfile;
	}
	export default class TimeAxis extends Component<TimeAxisProps> {
	    layout: HeaderBodyLayout;
	    header: TimelineHeader;
	    slats: TimelineSlats;
	    nowIndicator: TimelineNowIndicator;
	    tDateProfile: TimelineDateProfile;
	    constructor(context: ComponentContext, headerContainerEl: any, bodyContainerEl: any);
	    destroy(): void;
	    render(props: TimeAxisProps): void;
	    getNowIndicatorUnit(dateProfile: DateProfile): string;
	    renderNowIndicator(date: any): void;
	    unrenderNowIndicator(): void;
	    updateSize(isResize: any, totalHeight: any, isAuto: any): void;
	    computeSlotWidth(): any;
	    computeDefaultSlotWidth(tDateProfile: any): number;
	    applySlotWidth(slotWidth: number | string): void;
	    computeDateSnapCoverage(date: DateMarker): number;
	    dateToCoord(date: any): any;
	    rangeToCoords(range: any): {
	        right: any;
	        left: any;
	    };
	    computeInitialDateScroll(): {
	        left: number;
	    };
	    queryDateScroll(): {
	        left: number;
	    };
	    applyDateScroll(scroll: any): void;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/TimelineLaneEventRenderer' {
	import { FgEventRenderer, Seg, ComponentContext } from 'fullcalendar';
	import TimeAxis from 'fullcalendar-scheduler/src/timeline/TimeAxis';
	export default class TimelineLaneEventRenderer extends FgEventRenderer {
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
declare module 'fullcalendar-scheduler/src/timeline/TimelineLaneFillRenderer' {
	import { FillRenderer, ComponentContext, Seg } from 'fullcalendar';
	import TimeAxis from 'fullcalendar-scheduler/src/timeline/TimeAxis';
	export default class TimelineLaneFillRenderer extends FillRenderer {
	    timeAxis: TimeAxis;
	    masterContainerEl: HTMLElement;
	    constructor(context: ComponentContext, masterContainerEl: HTMLElement, timeAxis: TimeAxis);
	    attachSegs(type: any, segs: any): HTMLElement[];
	    computeSegSizes(segs: Seg[]): void;
	    assignSegSizes(segs: Seg[]): void;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/TimelineLane' {
	import { Duration, EventStore, EventUiHash, DateMarker, DateSpan, EventInteractionState, EventSegUiInteractionState, DateComponent, ComponentContext, Seg, DateProfile } from 'fullcalendar';
	import TimeAxis from 'fullcalendar-scheduler/src/timeline/TimeAxis';
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
	export default class TimelineLane extends DateComponent<TimelineLaneProps> {
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
declare module 'fullcalendar-scheduler/src/timeline/TimelineView' {
	import { Hit, View, ViewProps, ComponentContext, ViewSpec, DateProfileGenerator, OffsetTracker, DateProfile } from 'fullcalendar';
	import TimeAxis from 'fullcalendar-scheduler/src/timeline/TimeAxis';
	import TimelineLane from 'fullcalendar-scheduler/src/timeline/TimelineLane';
	export default class TimelineView extends View {
	    timeAxis: TimeAxis;
	    lane: TimelineLane;
	    offsetTracker: OffsetTracker;
	    constructor(context: ComponentContext, viewSpec: ViewSpec, dateProfileGenerator: DateProfileGenerator, parentEl: HTMLElement);
	    destroy(): void;
	    renderSkeletonHtml(): string;
	    render(props: ViewProps): void;
	    updateSize(isResize: any, totalHeight: any, isAuto: any): void;
	    getNowIndicatorUnit(dateProfile: DateProfile): string;
	    renderNowIndicator(date: any): void;
	    unrenderNowIndicator(): void;
	    computeInitialDateScroll(): {
	        left: number;
	    };
	    applyDateScroll(scroll: any): void;
	    queryScroll(): {
	        top: number;
	        left: number;
	    };
	    prepareHits(): void;
	    releaseHits(): void;
	    queryHit(leftOffset: any, topOffset: any): Hit;
	}

}
declare module 'fullcalendar-scheduler/src/common/resource-hierarchy' {
	/// <reference path="../../fullcalendar/dist/fullcalendar.d.ts" />
	import { ResourceHash, Resource } from 'fullcalendar-scheduler/src/structs/resource';
	import { ResourceEntityExpansions } from 'fullcalendar-scheduler/src/reducers/resourceEntityExpansions';
	export interface Group {
	    value: any;
	    spec: any;
	}
	export interface GroupNode {
	    id: string;
	    isExpanded: boolean;
	    group: Group;
	}
	export interface ResourceNode {
	    id: string;
	    rowSpans: number[];
	    depth: number;
	    isExpanded: boolean;
	    hasChildren: boolean;
	    resource: Resource;
	    resourceFields: any;
	}
	export function flattenResources(resourceStore: ResourceHash, orderSpecs: any): Resource[];
	export function buildRowNodes(resourceStore: ResourceHash, groupSpecs: any, orderSpecs: any, isVGrouping: boolean, expansions: ResourceEntityExpansions, expansionDefault: boolean): (GroupNode | ResourceNode)[];
	export function buildResourceFields(resource: Resource): {
	    id: string;
	    parentId: string;
	    title: string;
	    businessHours: import("fullcalendar").EventStore;
	    ui: import("fullcalendar").EventUi;
	    extendedProps: {
	        [extendedProp: string]: any;
	    };
	    startEditable: boolean;
	    durationEditable: boolean;
	    constraints: import("fullcalendar").Constraint[];
	    overlap: boolean;
	    allows: import("fullcalendar").AllowFunc[];
	    backgroundColor: string;
	    borderColor: string;
	    textColor: string;
	    classNames: string[];
	};
	export function isGroupsEqual(group0: Group, group1: Group): boolean;

}
declare module 'fullcalendar-scheduler/src/resource-timeline/Row' {
	import { Component, ComponentContext } from 'fullcalendar';
	export default abstract class Row<PropsType> extends Component<PropsType> {
	    spreadsheetTr: HTMLElement;
	    timeAxisTr: HTMLElement;
	    isSizeDirty: boolean;
	    constructor(context: ComponentContext, spreadsheetParent: HTMLElement, spreadsheetNextSibling: HTMLElement, timeAxisParent: HTMLElement, timeAxisNextSibling: HTMLElement);
	    destroy(): void;
	    abstract getHeightEls(): HTMLElement[];
	    updateSize(isResize: boolean): void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/render-utils' {
	export function updateExpanderIcon(el: HTMLElement, isExpanded: boolean, isRtl: boolean): void;
	export function clearExpanderIcon(el: HTMLElement): void;
	export function updateTrResourceId(tr: HTMLElement, resourceId: string): void;

}
declare module 'fullcalendar-scheduler/src/resource-timeline/GroupRow' {
	import { Group } from 'fullcalendar-scheduler/src/common/resource-hierarchy';
	import Row from 'fullcalendar-scheduler/src/resource-timeline/Row';
	export interface GroupRowProps {
	    spreadsheetColCnt: number;
	    id: string;
	    isExpanded: boolean;
	    group: Group;
	}
	export default class GroupRow extends Row<GroupRowProps> {
	    spreadsheetHeightEl: HTMLElement;
	    timeAxisHeightEl: HTMLElement;
	    expanderIconEl: HTMLElement;
	    private _renderCells;
	    private _updateExpanderIcon;
	    render(props: GroupRowProps): void;
	    destroy(): void;
	    renderCells(group: Group, spreadsheetColCnt: number): void;
	    unrenderCells(): void;
	    renderSpreadsheetContent(group: Group): HTMLElement;
	    renderCellText(group: Group): any;
	    getHeightEls(): HTMLElement[];
	    updateExpanderIcon(isExpanded: boolean): void;
	    onExpanderClick: (ev: UIEvent) => void;
	}

}
declare module 'fullcalendar-scheduler/src/common/resource-rendering' {
	import { Resource } from 'fullcalendar-scheduler/src/structs/resource';
	export function buildResourceTextFunc(resourceTextSetting: any, calendar: any): (resource: Resource) => any;

}
declare module 'fullcalendar-scheduler/src/resource-timeline/SpreadsheetRow' {
	import { Component, ComponentContext } from 'fullcalendar';
	import { Resource } from 'fullcalendar-scheduler/src/structs/resource';
	export interface SpreadsheetRowProps {
	    colSpecs: any;
	    id: string;
	    rowSpans: number[];
	    depth: number;
	    isExpanded: boolean;
	    hasChildren: boolean;
	    resource: Resource;
	}
	export default class SpreadsheetRow extends Component<SpreadsheetRowProps> {
	    tr: HTMLElement;
	    heightEl: HTMLElement;
	    expanderIconEl: HTMLElement;
	    private _renderRow;
	    private _updateTrResourceId;
	    private _updateExpanderIcon;
	    constructor(context: ComponentContext, tr: HTMLElement);
	    render(props: SpreadsheetRowProps): void;
	    destroy(): void;
	    renderRow(resource: Resource, rowSpans: number[], depth: number, colSpecs: any): void;
	    unrenderRow(): void;
	    updateExpanderIcon(hasChildren: boolean, isExpanded: boolean): void;
	    onExpanderClick: (ev: UIEvent) => void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/ResourceRow' {
	import { Duration, ComponentContext, EventInteractionState, DateSpan, EventUiHash, EventStore, DateProfile } from 'fullcalendar';
	import Row from 'fullcalendar-scheduler/src/resource-timeline/Row';
	import SpreadsheetRow from 'fullcalendar-scheduler/src/resource-timeline/SpreadsheetRow';
	import TimelineLane from 'fullcalendar-scheduler/src/timeline/TimelineLane';
	import { Resource } from 'fullcalendar-scheduler/src/structs/resource';
	export interface ResourceRowProps {
	    dateProfile: DateProfile;
	    nextDayThreshold: Duration;
	    businessHours: EventStore | null;
	    eventStore: EventStore | null;
	    eventUiBases: EventUiHash;
	    dateSelection: DateSpan | null;
	    eventSelection: string;
	    eventDrag: EventInteractionState | null;
	    eventResize: EventInteractionState | null;
	    colSpecs: any;
	    id: string;
	    rowSpans: number[];
	    depth: number;
	    isExpanded: boolean;
	    hasChildren: boolean;
	    resource: Resource;
	}
	export default class ResourceRow extends Row<ResourceRowProps> {
	    innerContainerEl: HTMLElement;
	    spreadsheetRow: SpreadsheetRow;
	    lane: TimelineLane;
	    private _updateTrResourceId;
	    constructor(context: ComponentContext, a: any, b: any, c: any, d: any, timeAxis: any);
	    destroy(): void;
	    render(props: ResourceRowProps): void;
	    updateSize(isResize: boolean): void;
	    getHeightEls(): HTMLElement[];
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/SpreadsheetHeader' {
	import { Component, ComponentContext } from 'fullcalendar';
	export interface SpreadsheetHeaderProps {
	    superHeaderText: string;
	    colSpecs: any;
	    colTags: string;
	}
	export default class SpreadsheetHeader extends Component<SpreadsheetHeaderProps> {
	    tableEl: HTMLElement;
	    constructor(context: ComponentContext, parentEl: HTMLElement);
	    destroy(): void;
	    render(props: SpreadsheetHeaderProps): void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/Spreadsheet' {
	import { Component, ComponentContext } from 'fullcalendar';
	import SpreadsheetHeader from 'fullcalendar-scheduler/src/resource-timeline/SpreadsheetHeader';
	import HeaderBodyLayout from 'fullcalendar-scheduler/src/timeline/HeaderBodyLayout';
	export interface SpreadsheetProps {
	    superHeaderText: string;
	    colSpecs: any;
	}
	export default class Spreadsheet extends Component<SpreadsheetProps> {
	    header: SpreadsheetHeader;
	    layout: HeaderBodyLayout;
	    bodyContainerEl: HTMLElement;
	    bodyColGroup: HTMLElement;
	    bodyTbody: HTMLElement;
	    private _renderCells;
	    constructor(context: ComponentContext, headParentEl: HTMLElement, bodyParentEl: HTMLElement);
	    destroy(): void;
	    render(props: SpreadsheetProps): void;
	    renderCells(superHeaderText: any, colSpecs: any): void;
	    unrenderCells(): void;
	    renderColTags(colSpecs: any): string;
	    updateSize(isResize: any, totalHeight: any, isAuto: any): void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/ResourceTimelineView' {
	import { SplittableProps, PositionCache, Hit, OffsetTracker, View, ViewSpec, ComponentContext, DateProfileGenerator, DateProfile } from 'fullcalendar';
	import TimeAxis from 'fullcalendar-scheduler/src/timeline/TimeAxis';
	import { GroupNode, ResourceNode } from 'fullcalendar-scheduler/src/common/resource-hierarchy';
	import GroupRow from 'fullcalendar-scheduler/src/resource-timeline/GroupRow';
	import ResourceRow from 'fullcalendar-scheduler/src/resource-timeline/ResourceRow';
	import ScrollJoiner from 'fullcalendar-scheduler/src/util/ScrollJoiner';
	import Spreadsheet from 'fullcalendar-scheduler/src/resource-timeline/Spreadsheet';
	import TimelineLane from 'fullcalendar-scheduler/src/timeline/TimelineLane';
	import { ResourceViewProps } from 'fullcalendar-scheduler/src/View';
	export default class ResourceTimelineView extends View {
	    static needsResourceData: boolean;
	    props: ResourceViewProps;
	    spreadsheet: Spreadsheet;
	    timeAxis: TimeAxis;
	    lane: TimelineLane;
	    bodyScrollJoiner: ScrollJoiner;
	    timeAxisTbody: HTMLElement;
	    miscHeight: number;
	    rowNodes: (GroupNode | ResourceNode)[];
	    rowComponents: (GroupRow | ResourceRow)[];
	    rowComponentsById: {
	        [id: string]: (GroupRow | ResourceRow);
	    };
	    superHeaderText: any;
	    isVGrouping: any;
	    isHGrouping: any;
	    groupSpecs: any;
	    colSpecs: any;
	    orderSpecs: any;
	    rowPositions: PositionCache;
	    offsetTracker: OffsetTracker;
	    private splitter;
	    private hasResourceBusinessHours;
	    private buildRowNodes;
	    private hasNesting;
	    private _updateHasNesting;
	    constructor(context: ComponentContext, viewSpec: ViewSpec, dateProfileGenerator: DateProfileGenerator, parentEl: HTMLElement);
	    renderSkeletonHtml(): string;
	    render(props: ResourceViewProps): void;
	    updateHasNesting(isNesting: boolean): void;
	    diffRows(newNodes: any): void;
	    addRow(index: any, rowNode: any): void;
	    removeRows(startIndex: any, len: any, oldRowNodes: any): void;
	    buildChildComponent(node: (GroupNode | ResourceNode), spreadsheetTbody: HTMLElement, spreadsheetNext: HTMLElement, timeAxisTbody: HTMLElement, timeAxisNext: HTMLElement): GroupRow | ResourceRow;
	    renderRows(dateProfile: DateProfile, fallbackBusinessHours: any, splitProps: {
	        [resourceId: string]: SplittableProps;
	    }): void;
	    updateSize(isResize: any, viewHeight: any, isAuto: any): void;
	    syncHeadHeights(): void;
	    updateRowSizes(isResize: boolean): number;
	    destroy(): void;
	    getNowIndicatorUnit(dateProfile: DateProfile): string;
	    renderNowIndicator(date: any): void;
	    unrenderNowIndicator(): void;
	    queryScroll(): any;
	    applyScroll(scroll: any): void;
	    computeInitialDateScroll(): {
	        left: number;
	    };
	    queryDateScroll(): {
	        left: number;
	    };
	    applyDateScroll(scroll: any): void;
	    queryResourceScroll(): any;
	    applyResourceScroll(scroll: any): void;
	    prepareHits(): void;
	    releaseHits(): void;
	    queryHit(leftOffset: any, topOffset: any): Hit;
	}

}
declare module 'fullcalendar-scheduler/src/common/ResourceDayHeader' {
	import { Component, ComponentContext, DateMarker, DateProfile, DateFormatter } from 'fullcalendar';
	import { Resource } from 'fullcalendar-scheduler/src/structs/resource';
	export interface ResourceDayHeaderProps {
	    dates: DateMarker[];
	    dateProfile: DateProfile;
	    datesRepDistinctDays: boolean;
	    resources: Resource[];
	    renderIntroHtml?: () => string;
	}
	export default class ResourceDayHeader extends Component<ResourceDayHeaderProps> {
	    datesAboveResources: boolean;
	    resourceTextFunc: (resource: Resource) => string;
	    dateFormat: DateFormatter;
	    el: HTMLElement;
	    thead: HTMLElement;
	    constructor(context: ComponentContext, parentEl: HTMLElement);
	    destroy(): void;
	    render(props: ResourceDayHeaderProps): void;
	    renderResourceRow(resources: Resource[]): string;
	    renderDayAndResourceRows(dates: DateMarker[], resources: Resource[]): string;
	    renderResourceAndDayRows(resources: Resource[], dates: DateMarker[]): string;
	    renderResourceCell(resource: Resource, colspan: number, date?: DateMarker): string;
	    renderDateCell(date: DateMarker, colspan: number, resource?: Resource): string;
	    buildTr(cellHtmls: string[]): string;
	    processResourceEls(resources: Resource[]): void;
	}

}
declare module 'fullcalendar-scheduler/src/common/resource-day-table' {
	import { SlicedProps, EventDef, Splitter, DayTable, DayTableCell, ViewSpec, SplittableProps, DateSpan, Seg, EventSegUiInteractionState } from 'fullcalendar';
	import { Resource } from 'fullcalendar-scheduler/src/structs/resource';
	export interface ResourceDayTableCell extends DayTableCell {
	    resource: Resource;
	}
	export abstract class AbstractResourceDayTable {
	    cells: ResourceDayTableCell[][];
	    rowCnt: number;
	    colCnt: number;
	    dayTable: DayTable;
	    resources: Resource[];
	    resourceIndex: ResourceIndex;
	    constructor(dayTable: DayTable, resources: Resource[]);
	    abstract computeCol(dateI: any, resourceI: any): number;
	    abstract computeColRanges(dateStartI: any, dateEndI: any, resourceI: any): {
	        firstCol: number;
	        lastCol: number;
	        isStart: boolean;
	        isEnd: boolean;
	    }[];
	    buildCells(): ResourceDayTableCell[][];
	}
	export class ResourceDayTable extends AbstractResourceDayTable {
	    computeCol(dateI: any, resourceI: any): any;
	    computeColRanges(dateStartI: any, dateEndI: any, resourceI: any): {
	        firstCol: any;
	        lastCol: any;
	        isStart: boolean;
	        isEnd: boolean;
	    }[];
	}
	export class DayResourceTable extends AbstractResourceDayTable {
	    computeCol(dateI: any, resourceI: any): any;
	    computeColRanges(dateStartI: any, dateEndI: any, resourceI: any): any[];
	}
	export class ResourceIndex {
	    indicesById: {
	        [resourceId: string]: number;
	    };
	    ids: string[];
	    length: number;
	    constructor(resources: Resource[]);
	}
	export function isVResourceViewEnabled(viewSpec: ViewSpec): boolean;
	export interface VResourceProps extends SplittableProps {
	    resourceDayTable: AbstractResourceDayTable;
	}
	export class VResourceSplitter extends Splitter<VResourceProps> {
	    getKeyInfo(props: VResourceProps): any;
	    getKeysForDateSpan(dateSpan: DateSpan): string[];
	    getKeysForEventDef(eventDef: EventDef): string[];
	}
	export abstract class VResourceJoiner<SegType extends Seg> {
	    private joinDateSelection;
	    private joinBusinessHours;
	    private joinFgEvents;
	    private joinBgEvents;
	    private joinEventDrags;
	    private joinEventResizes;
	    joinProps(propSets: {
	        [resourceId: string]: SlicedProps<SegType>;
	    }, resourceDayTable: AbstractResourceDayTable): SlicedProps<SegType>;
	    joinSegs(resourceDayTable: AbstractResourceDayTable, ...segGroups: SegType[][]): SegType[];
	    expandSegs(resourceDayTable: AbstractResourceDayTable, segs: SegType[]): any[];
	    joinInteractions(resourceDayTable: AbstractResourceDayTable, ...interactions: EventSegUiInteractionState[]): EventSegUiInteractionState;
	    abstract transformSeg(seg: SegType, resourceDayTable: AbstractResourceDayTable, resourceI: number): SegType[];
	}

}
declare module 'fullcalendar-scheduler/src/resource-agenda/ResourceTimeGrid' {
	import { OffsetTracker, DateSpan, DateComponent, TimeGrid, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, DateMarker, Hit } from 'fullcalendar';
	import { AbstractResourceDayTable } from 'fullcalendar-scheduler/src/common/resource-day-table';
	export interface ResourceTimeGridProps {
	    dateProfile: DateProfile | null;
	    resourceDayTable: AbstractResourceDayTable;
	    businessHours: EventStore;
	    eventStore: EventStore;
	    eventUiBases: EventUiHash;
	    dateSelection: DateSpan | null;
	    eventSelection: string;
	    eventDrag: EventInteractionState | null;
	    eventResize: EventInteractionState | null;
	}
	export default class ResourceTimeGrid extends DateComponent<ResourceTimeGridProps> {
	    timeGrid: TimeGrid;
	    offsetTracker: OffsetTracker;
	    private buildDayRanges;
	    private dayRanges;
	    private splitter;
	    private slicers;
	    private joiner;
	    constructor(context: ComponentContext, timeGrid: TimeGrid);
	    render(props: ResourceTimeGridProps): void;
	    renderNowIndicator(date: DateMarker): void;
	    prepareHits(): void;
	    releaseHits(): void;
	    queryHit(leftOffset: any, topOffset: any): Hit;
	}

}
declare module 'fullcalendar-scheduler/src/resource-basic/ResourceDayGrid' {
	import { Hit, OffsetTracker, DateSpan, DayGrid, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, Duration } from 'fullcalendar';
	import { AbstractResourceDayTable } from 'fullcalendar-scheduler/src/common/resource-day-table';
	export interface ResourceDayGridProps {
	    dateProfile: DateProfile | null;
	    resourceDayTable: AbstractResourceDayTable;
	    businessHours: EventStore;
	    eventStore: EventStore;
	    eventUiBases: EventUiHash;
	    dateSelection: DateSpan | null;
	    eventSelection: string;
	    eventDrag: EventInteractionState | null;
	    eventResize: EventInteractionState | null;
	    isRigid: boolean;
	    nextDayThreshold: Duration;
	}
	export default class ResourceDayGrid extends DateComponent<ResourceDayGridProps> {
	    dayGrid: DayGrid;
	    offsetTracker: OffsetTracker;
	    private splitter;
	    private slicers;
	    private joiner;
	    constructor(context: ComponentContext, dayGrid: DayGrid);
	    render(props: ResourceDayGridProps): void;
	    prepareHits(): void;
	    releaseHits(): void;
	    queryHit(leftOffset: any, topOffset: any): Hit;
	}

}
declare module 'fullcalendar-scheduler/src/resource-agenda/ResourceAgendaView' {
	import { AbstractAgendaView, ComponentContext, ViewSpec, DateProfileGenerator } from 'fullcalendar';
	import ResourceDayHeader from 'fullcalendar-scheduler/src/common/ResourceDayHeader';
	import ResourceTimeGrid from 'fullcalendar-scheduler/src/resource-agenda/ResourceTimeGrid';
	import ResourceDayGrid from 'fullcalendar-scheduler/src/resource-basic/ResourceDayGrid';
	import { ResourceViewProps } from 'fullcalendar-scheduler/src/View';
	export default class ResourceAgendaView extends AbstractAgendaView {
	    static needsResourceData: boolean;
	    props: ResourceViewProps;
	    header: ResourceDayHeader;
	    resourceTimeGrid: ResourceTimeGrid;
	    resourceDayGrid: ResourceDayGrid;
	    private resourceOrderSpecs;
	    private flattenResources;
	    private buildResourceDayTable;
	    constructor(context: ComponentContext, viewSpec: ViewSpec, dateProfileGenerator: DateProfileGenerator, parentEl: HTMLElement);
	    destroy(): void;
	    render(props: ResourceViewProps): void;
	    renderNowIndicator(date: any): void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-basic/ResourceBasicView' {
	import { AbstractBasicView, ComponentContext, ViewSpec, DateProfileGenerator } from 'fullcalendar';
	import ResourceDayHeader from 'fullcalendar-scheduler/src/common/ResourceDayHeader';
	import ResourceDayGrid from 'fullcalendar-scheduler/src/resource-basic/ResourceDayGrid';
	import { ResourceViewProps } from 'fullcalendar-scheduler/src/View';
	export default class ResourceBasicView extends AbstractBasicView {
	    static needsResourceData: boolean;
	    props: ResourceViewProps;
	    header: ResourceDayHeader;
	    resourceDayGrid: ResourceDayGrid;
	    private resourceOrderSpecs;
	    private flattenResources;
	    private buildResourceDayTable;
	    constructor(context: ComponentContext, viewSpec: ViewSpec, dateProfileGenerator: DateProfileGenerator, parentEl: HTMLElement);
	    destroy(): void;
	    render(props: ResourceViewProps): void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-sources/resource-array' {
	export {};

}
declare module 'fullcalendar-scheduler/src/resource-sources/resource-json-feed' {
	export {};

}
declare module 'fullcalendar-scheduler/src/timeline/config' {
	 const _default: import("fullcalendar").PluginDef;
	export default _default;

}
declare module 'fullcalendar-scheduler/src/resource-timeline/config' {
	 const _default: import("fullcalendar").PluginDef;
	export default _default;

}
declare module 'fullcalendar-scheduler/src/resource-agenda/config' {
	 const _default: import("fullcalendar").PluginDef;
	export default _default;

}
declare module 'fullcalendar-scheduler/src/resource-basic/config' {
	 const _default: import("fullcalendar").PluginDef;
	export default _default;

}
declare module 'fullcalendar-scheduler/src/main' {
	import * as exportHooks from 'fullcalendar';
	import 'fullcalendar-scheduler/src/api/EventApi';
	import 'fullcalendar-scheduler/src/resource-sources/resource-array';
	import 'fullcalendar-scheduler/src/resource-sources/resource-func';
	import 'fullcalendar-scheduler/src/resource-sources/resource-json-feed';
	export const GeneralPlugin: exportHooks.PluginDef;

}
declare module 'fullcalendar-scheduler' {
	import main = require('fullcalendar-scheduler/src/main');
	export = main;
}
