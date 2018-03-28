declare module 'fullcalendar-scheduler/src/ResourceViewMixin' {
	import { Mixin } from 'fullcalendar';
	export interface ResourceViewInterface {
	    initResourceView(): any;
	    getResourceTextFunc(): any;
	}
	export default class ResourceViewMixin extends Mixin implements ResourceViewInterface {
	    resourceTextFunc: any;
	    isResourcesRendered: boolean;
	    calendar: any;
	    canHandleSpecificResources: boolean;
	    static mixInto(destClass: any): void;
	    initResourceView(): void;
	    bindBaseRenderHandlers(): void;
	    queryScroll(): any;
	    applyScroll(scroll: any): void;
	    queryResourceScroll(): {};
	    applyResourceScroll(): void;
	    getResourceText(resource: any): any;
	    getResourceTextFunc(): any;
	    handleResourceAdd(resource: any): void;
	    handleResourceRemove(resource: any): void;
	    requestResourcesRender(resources: any): void;
	    requestResourcesUnrender(): void;
	    requestResourceRender(resource: any): void;
	    requestResourceUnrender(resource: any): void;
	    executeResourcesRender(resources: any): void;
	    executeResourcesUnrender(): void;
	    executeResourceRender(resource: any): void;
	    executeResourceUnrender(resource: any): void;
	    triggerDayClick(footprint: any, dayEl: any, ev: any): void;
	    triggerSelect(footprint: any, ev: any): void;
	    triggerExternalDrop(singleEventDef: any, isEvent: any, el: any, ev: any, ui: any): void;
	}

}
declare module 'fullcalendar-scheduler/src/models/ResourceComponentFootprint' {
	import { ComponentFootprint } from 'fullcalendar';
	export default class ResourceComponentFootprint extends ComponentFootprint {
	    resourceId: string;
	    constructor(unzonedRange: any, isAllDay: any, resourceId: any);
	    toLegacy(calendar: any): {
	        start: any;
	        end: any;
	    };
	}

}
declare module 'fullcalendar-scheduler/src/component/ResourceDayTableMixin' {
	import { Mixin } from 'fullcalendar';
	export interface ResourceDayTableInterface {
	    resourceCnt: any;
	    flattenedResources: any;
	    datesAboveResources: boolean;
	    registerResources(resources: any): any;
	    processHeadResourceEls(containerEl: any): any;
	    getColResource(col: any): any;
	    indicesToCol(resourceIndex: any, dayIndex: any): any;
	}
	export default class ResourceDayTableMixin extends Mixin implements ResourceDayTableInterface {
	    flattenedResources: any;
	    resourceCnt: number;
	    datesAboveResources: boolean;
	    allowCrossResource: boolean;
	    daysPerRow: number;
	    dayCnt: number;
	    colCnt: number;
	    isRTL: boolean;
	    dayDates: any;
	    view: any;
	    hasAllDayBusinessHours: boolean;
	    dateProfile: any;
	    businessHourRenderer: any;
	    static mixInto(destClass: any): void;
	    registerResources(resources: any): void;
	    flattenResources(resources: any): any[];
	    accumulateResources(resources: any, sortFunc: any, res: any): void;
	    updateDayTableCols(): void;
	    computeColCnt(): number;
	    getColDayIndex(col: any): number;
	    getColResource(col: any): any;
	    getColResourceIndex(col: any): number;
	    indicesToCol(resourceIndex: any, dayIndex: any): any;
	    renderHeadTrHtml(): string;
	    renderHeadResourceHtml(): string;
	    renderHeadResourceAndDateHtml(): string;
	    renderHeadDateAndResourceHtml(): string;
	    renderHeadResourceCellHtml(resource: any, date?: any, colspan?: number): string;
	    renderHeadResourceDateCellHtml(date: any, resource: any, colspan?: number): any;
	    processHeadResourceEls(containerEl: any): void;
	    renderBgCellsHtml(row: any): string;
	    renderResourceBgCellHtml(date: any, resource: any): any;
	    wrapTr(cellHtmls: any, introMethodName: any): string;
	    renderBusinessHours(businessHourGenerator: any): any;
	}

}
declare module 'fullcalendar-scheduler/src/resource-basic/ResourceDayGrid' {
	import { DayGrid } from 'fullcalendar';
	import { ResourceDayTableInterface } from 'fullcalendar-scheduler/src/component/ResourceDayTableMixin';
	import ResourceComponentFootprint from 'fullcalendar-scheduler/src/models/ResourceComponentFootprint';
	export default class ResourceDayGrid extends DayGrid {
	    datesAboveResources: ResourceDayTableInterface['datesAboveResources'];
	    registerResources: ResourceDayTableInterface['registerResources'];
	    processHeadResourceEls: ResourceDayTableInterface['processHeadResourceEls'];
	    getColResource: ResourceDayTableInterface['getColResource'];
	    resourceCnt: ResourceDayTableInterface['resourceCnt'];
	    indicesToCol: ResourceDayTableInterface['indicesToCol'];
	    flattenedResources: ResourceDayTableInterface['flattenedResources'];
	    isResourceFootprintsEnabled: boolean;
	    constructor(view: any);
	    renderDates(dateProfile: any): void;
	    renderResources(resources: any): void;
	    getHitFootprint(hit: any): ResourceComponentFootprint;
	    componentFootprintToSegs(componentFootprint: any): any[];
	}

}
declare module 'fullcalendar-scheduler/src/resource-agenda/ResourceTimeGrid' {
	import { TimeGrid } from 'fullcalendar';
	import { ResourceDayTableInterface } from 'fullcalendar-scheduler/src/component/ResourceDayTableMixin';
	import ResourceComponentFootprint from 'fullcalendar-scheduler/src/models/ResourceComponentFootprint';
	export default class ResourceTimeGrid extends TimeGrid {
	    registerResources: ResourceDayTableInterface['registerResources'];
	    processHeadResourceEls: ResourceDayTableInterface['processHeadResourceEls'];
	    getColResource: ResourceDayTableInterface['getColResource'];
	    resourceCnt: ResourceDayTableInterface['resourceCnt'];
	    indicesToCol: ResourceDayTableInterface['indicesToCol'];
	    flattenedResources: ResourceDayTableInterface['flattenedResources'];
	    isResourceFootprintsEnabled: boolean;
	    constructor(view: any);
	    renderDates(dateProfile: any): void;
	    renderResources(resources: any): void;
	    getHitFootprint(hit: any): ResourceComponentFootprint;
	    componentFootprintToSegs(componentFootprint: any): any[];
	}

}
declare module 'fullcalendar-scheduler/src/resource-agenda/ResourceAgendaView' {
	import { AgendaView } from 'fullcalendar';
	import { ResourceViewInterface } from 'fullcalendar-scheduler/src/ResourceViewMixin';
	export default class ResourceAgendaView extends AgendaView {
	    initResourceView: ResourceViewInterface['initResourceView'];
	    constructor(calendar: any, viewSpec: any);
	}

}
declare module 'fullcalendar-scheduler/src/resource-basic/ResourceBasicView' {
	import { BasicView } from 'fullcalendar';
	import { ResourceViewInterface } from 'fullcalendar-scheduler/src/ResourceViewMixin';
	export default class ResourceBasicView extends BasicView {
	    initResourceView: ResourceViewInterface['initResourceView'];
	    constructor(calendar: any, viewSpec: any);
	}

}
declare module 'fullcalendar-scheduler/src/resource-basic/ResourceMonthView' {
	import { MonthView } from 'fullcalendar';
	import { ResourceViewInterface } from 'fullcalendar-scheduler/src/ResourceViewMixin';
	export default class ResourceMonthView extends MonthView {
	    initResourceView: ResourceViewInterface['initResourceView'];
	    constructor(calendar: any, viewSpec: any);
	}

}
declare module 'fullcalendar-scheduler/src/util/EnhancedScroller' {
	import { Scroller, EmitterInterface, ListenerInterface } from 'fullcalendar';
	export default class EnhancedScroller extends Scroller {
	    on: EmitterInterface['on'];
	    one: EmitterInterface['one'];
	    off: EmitterInterface['off'];
	    trigger: EmitterInterface['trigger'];
	    triggerWith: EmitterInterface['triggerWith'];
	    hasHandlers: EmitterInterface['hasHandlers'];
	    listenTo: ListenerInterface['listenTo'];
	    stopListeningTo: ListenerInterface['stopListeningTo'];
	    canvas: any;
	    isScrolling: boolean;
	    isTouching: boolean;
	    isTouchedEver: boolean;
	    isMoving: boolean;
	    isTouchScrollEnabled: boolean;
	    preventTouchScrollHandler: any;
	    requestMovingEnd: any;
	    constructor(options?: any);
	    render(): void;
	    destroy(): void;
	    disableTouchScroll(): void;
	    enableTouchScroll(): void;
	    bindPreventTouchScroll(): void;
	    unbindPreventTouchScroll(): void;
	    bindHandlers(): any;
	    unbindHandlers(): any;
	    reportScroll(): void;
	    reportScrollStart(): void;
	    reportMovingEnd(): void;
	    reportScrollEnd(): void;
	    reportTouchStart(): void;
	    reportTouchEnd(): void;
	    getScrollLeft(): any;
	    setScrollLeft(val: any): void;
	    getScrollFromLeft(): any;
	    getNativeScrollLeft(): any;
	    setNativeScrollLeft(val: any): void;
	}

}
declare module 'fullcalendar-scheduler/src/util/ClippedScroller' {
	import EnhancedScroller from 'fullcalendar-scheduler/src/util/EnhancedScroller';
	export default class ClippedScroller extends EnhancedScroller {
	    isHScrollbarsClipped: boolean;
	    isVScrollbarsClipped: boolean;
	    constructor(options?: any);
	    renderEl(): JQuery;
	    updateSize(): any;
	    getScrollbarWidths(): any;
	}

}
declare module 'fullcalendar-scheduler/src/util/ScrollerCanvas' {
	export default class ScrollerCanvas {
	    el: any;
	    contentEl: any;
	    bgEl: any;
	    gutters: any;
	    width: any;
	    minWidth: any;
	    constructor();
	    render(): void;
	    setGutters(gutters: any): void;
	    setWidth(width: any): void;
	    setMinWidth(minWidth: any): void;
	    clearWidth(): void;
	    updateSize(): void;
	}

}
declare module 'fullcalendar-scheduler/src/util/ScrollJoiner' {
	export default class ScrollJoiner {
	    axis: any;
	    scrollers: any;
	    masterScroller: any;
	    constructor(axis: any, scrollers: any);
	    initScroller(scroller: any): void;
	    assignMasterScroller(scroller: any): void;
	    unassignMasterScroller(): void;
	    update(): void;
	}

}
declare module 'fullcalendar-scheduler/src/util/ScrollFollowerSprite' {
	export default class ScrollFollowerSprite {
	    static uid: number;
	    id: any;
	    follower: any;
	    el: any;
	    absoluteEl: any;
	    naturalRect: any;
	    parentRect: any;
	    containerRect: any;
	    isEnabled: boolean;
	    isHFollowing: boolean;
	    isVFollowing: boolean;
	    doAbsolute: boolean;
	    isAbsolute: boolean;
	    isCentered: boolean;
	    rect: any;
	    isBlock: boolean;
	    naturalWidth: any;
	    constructor(el: any);
	    disable(): void;
	    enable(): void;
	    clear(): void;
	    cacheDimensions(): void;
	    updatePosition(): void;
	    resetPosition(): void;
	    computePosition(): void;
	    assignPosition(): void;
	    absolutize(): void;
	    unabsolutize(): void;
	    buildAbsoluteEl(): any;
	}

}
declare module 'fullcalendar-scheduler/src/util/ScrollFollower' {
	export default class ScrollFollower {
	    scroller: any;
	    scrollbarWidths: any;
	    spritesById: any;
	    viewportRect: any;
	    contentOffset: any;
	    isHFollowing: boolean;
	    isVFollowing: boolean;
	    allowPointerEvents: boolean;
	    containOnNaturalLeft: boolean;
	    containOnNaturalRight: boolean;
	    minTravel: number;
	    isTouch: boolean;
	    isForcedRelative: boolean;
	    constructor(scroller: any, allowPointerEvents?: boolean);
	    setSpriteEls(els: any): void;
	    clearSprites(): void;
	    addSprite(sprite: any): void;
	    removeSprite(sprite: any): void;
	    handleScroll(): void;
	    cacheDimensions(): void;
	    updateViewport(): {
	        left: any;
	        right: any;
	        top: any;
	        bottom: any;
	    };
	    forceRelative(): void;
	    clearForce(): void;
	    update(): void;
	    updatePositions(): void;
	    getContentRect(el: any): {
	        left: number;
	        right: any;
	        top: number;
	        bottom: any;
	    };
	    getBoundingRect(el: any): {
	        left: number;
	        right: any;
	        top: number;
	        bottom: any;
	    };
	    iterSprites(func: any): void;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/renderers/TimelineEventRenderer' {
	import { EventRenderer } from 'fullcalendar';
	export default class TimelineEventRenderer extends EventRenderer {
	    computeDisplayEventTime(): boolean;
	    computeDisplayEventEnd(): boolean;
	    computeEventTimeFormat(): any;
	    renderFgSegs(segs: any): void;
	    buildSegLevels(segs: any): any[];
	    unrenderFgSegs(segs: any): void;
	    fgSegHtml(seg: any, disableResizing: any): string;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/renderers/TimelineFillRenderer' {
	import { FillRenderer } from 'fullcalendar';
	export default class TimelineFillRenderer extends FillRenderer {
	    attachSegEls(type: any, segs: any): JQuery;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/renderers/TimelineHelperRenderer' {
	import { HelperRenderer } from 'fullcalendar';
	export default class TimelineHelperRenderer extends HelperRenderer {
	    renderSegs(segs: any, sourceSeg: any): JQuery;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/interactions/TimelineEventDragging' {
	import { EventDragging } from 'fullcalendar';
	export default class TimelineEventDragging extends EventDragging {
	    segDragStart(seg: any, ev: any): void;
	    segDragStop(seg: any, ev: any): void;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/interactions/TimelineEventResizing' {
	import { EventResizing } from 'fullcalendar';
	export default class TimelineEventResizing extends EventResizing {
	    segResizeStart(seg: any, ev: any): any;
	    segResizeStop(seg: any, ev: any): any;
	}

}
declare module 'fullcalendar-scheduler/src/timeline/TimelineView.defaults' {
	import TimelineView from 'fullcalendar-scheduler/src/timeline/TimelineView';
	export function initScaleProps(timelineView: TimelineView): void;

}
declare module 'fullcalendar-scheduler/src/timeline/TimelineView' {
	import { View, UnzonedRange, ComponentFootprint } from 'fullcalendar';
	export default class TimelineView extends View {
	    normalizedUnzonedRange: any;
	    normalizedUnzonedStart: any;
	    normalizedUnzonedEnd: any;
	    slotDates: any;
	    slotCnt: any;
	    snapCnt: any;
	    snapsPerSlot: any;
	    snapDiffToIndex: any;
	    snapIndexToDiff: any;
	    timeWindowMs: any;
	    slotDuration: any;
	    snapDuration: any;
	    duration: any;
	    labelInterval: any;
	    isTimeScale: any;
	    largeUnit: any;
	    headerFormats: any;
	    emphasizeWeeks: boolean;
	    timeHeadEl: any;
	    timeHeadColEls: any;
	    timeHeadScroller: any;
	    timeBodyEl: any;
	    timeBodyScroller: any;
	    timeScrollJoiner: any;
	    headDateFollower: any;
	    eventTitleFollower: any;
	    segContainerEl: any;
	    segContainerHeight: any;
	    bgSegContainerEl: any;
	    slatContainerEl: any;
	    slatColEls: any;
	    slatEls: any;
	    slotWidth: number;
	    timeBodyBoundCache: any;
	    slatCoordCache: any;
	    slatInnerCoordCache: any;
	    nowIndicatorEls: any;
	    isTimeBodyScrolled: boolean;
	    constructor(calendar: any, viewSpec: any);
	    normalizeComponentFootprint(componentFootprint: any): ComponentFootprint;
	    componentFootprintToSegs(footprint: any): any[];
	    normalizeGridDate(date: any): any;
	    isValidDate(date: any): boolean;
	    updateGridDates(): void;
	    renderSkeleton(): void;
	    renderSkeletonHtml(): string;
	    unrenderSkeleton(): void;
	    renderDates(dateProfile: any): void;
	    unrenderDates(): void;
	    renderSlatHtml(): {
	        headHtml: string;
	        bodyHtml: string;
	    };
	    buildCellObject(date: any, text: any, rowUnit: any): {
	        text: any;
	        spanHtml: string;
	        date: any;
	        colspan: number;
	    };
	    slatCellHtml(date: any, isEm: any): string;
	    renderBusinessHours(businessHourPayload: any): void;
	    getNowIndicatorUnit(): any;
	    renderNowIndicator(date: any): void;
	    unrenderNowIndicator(): void;
	    updateSize(totalHeight: any, isAuto: any, isResize: any): void;
	    queryMiscHeight(): number;
	    computeSlotWidth(): number;
	    buildCoords(): void;
	    computeDateSnapCoverage(date: any): any;
	    dateToCoord(date: any): any;
	    rangeToCoords(range: any): {
	        right: any;
	        left: any;
	    };
	    headHeight(...args: any[]): any;
	    updateSegPositions(): void;
	    handleTimeBodyScrolled(top: any): void;
	    computeInitialDateScroll(): {
	        left: number;
	    };
	    queryDateScroll(): {
	        left: any;
	    };
	    applyDateScroll(scroll: any): void;
	    prepareHits(): void;
	    queryHit(leftOffset: any, topOffset: any): any;
	    getHitFootprint(hit: any): ComponentFootprint;
	    getHitEl(hit: any): any;
	    getSnapUnzonedRange(snapIndex: any): UnzonedRange;
	    getSnapEl(snapIndex: any): any;
	    renderEventResize(eventFootprints: any, seg: any, isTouch: any): any;
	    unrenderEventResize(): any;
	    renderDrag(eventFootprints: any, seg: any, isTouch: any): boolean;
	    unrenderDrag(): void;
	}

}
declare module 'fullcalendar-scheduler/src/util/util' {
	export function getOwnCells(trs: any): any;

}
declare module 'fullcalendar-scheduler/src/resource-timeline/row/RowParent' {
	import { DateComponent } from 'fullcalendar';
	export default class RowParent extends DateComponent {
	    view: any;
	    parent: any;
	    prevSibling: any;
	    children: any;
	    depth: number;
	    hasOwnRow: boolean;
	    trHash: any;
	    trs: any;
	    isExpanded: boolean;
	    constructor(view: any);
	    addChildRowNode(child: any, index?: any): void;
	    removeChild(child: any): any;
	    removeChildren(): void;
	    removeFromParentAndDom(): void;
	    getLastChild(): any;
	    getPrevRowInDom(): this;
	    getLeadingRow(): any;
	    getRows(batchArray?: any[]): any[];
	    getNodes(batchArray?: any[]): any[];
	    getDescendants(): any[];
	    show(): void;
	    hide(): void;
	    renderSkeleton(): void;
	    removeElement(): void;
	    getTr(type: any): any;
	    expand(): void;
	    collapse(): void;
	    toggleExpanded(): void;
	    indicateExpanded(): void;
	    indicateCollapsed(): void;
	    indicateExpandingEnabled(): void;
	    indicateExpandingDisabled(): void;
	    updateExpandingEnabled(): void;
	    getExpandedIcon(): string;
	    getCollapsedIcon(): string;
	    animateExpand(): void;
	    getMaxTrInnerHeight(): number;
	    setTrInnerHeight(height: any): void;
	    descendantAdded(row: any): void;
	    descendantRemoved(row: any): void;
	    thisRowShown(): void;
	    thisRowHidden(): void;
	    descendantShown(row: any): void;
	    descendantHidden(row: any): void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/row/RowGroup' {
	import RowParent from 'fullcalendar-scheduler/src/resource-timeline/row/RowParent';
	export default class RowGroup extends RowParent {
	    groupSpec: any;
	    groupValue: any;
	    constructor(view: any, groupSpec: any, groupValue: any);
	    descendantRemoved(row: any): void;
	    renderGroupContentEl(): JQuery;
	    renderGroupTextEl(): JQuery;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/row/VRowGroup' {
	import RowGroup from 'fullcalendar-scheduler/src/resource-timeline/row/RowGroup';
	export default class VRowGroup extends RowGroup {
	    rowspan: number;
	    leadingTr: any;
	    groupTd: any;
	    constructor(view: any, groupSpec: any, groupValue: any);
	    renderRowspan(): void;
	    descendantShown(row: any): void;
	    descendantHidden(row: any): void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/Spreadsheet' {
	export default class Spreadsheet {
	    view: any;
	    isRTL: boolean;
	    headEl: any;
	    el: any;
	    tbodyEl: any;
	    headScroller: any;
	    bodyScroller: any;
	    scrollJoiner: any;
	    cellFollower: any;
	    colGroupHtml: string;
	    headTable: any;
	    headColEls: any;
	    headCellEls: any;
	    bodyColEls: any;
	    bodyTable: any;
	    givenColWidths: any;
	    colWidths: any;
	    colMinWidths: any;
	    tableWidth: any;
	    tableMinWidth: any;
	    constructor(view: any);
	    renderSkeleton(): void;
	    renderHeadHtml(): string;
	    initColResizing(): void;
	    colResizeMousedown(i: any, ev: any, resizerEl: any): void;
	    applyColWidths(): void;
	    computeColMinWidths(): any;
	    queryColWidths(): any;
	    updateSize(): void;
	    headHeight(): any;
	    updateCellFollower(): void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/ResourceTimelineEventRenderer' {
	import TimelineEventRenderer from 'fullcalendar-scheduler/src/timeline/renderers/TimelineEventRenderer';
	export default class ResourceTimelineEventRenderer extends TimelineEventRenderer {
	    renderFgRanges(eventRanges: any): void;
	    unrenderFgRanges(): void;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/row/EventRow' {
	import RowParent from 'fullcalendar-scheduler/src/resource-timeline/row/RowParent';
	export default class EventRow extends RowParent {
	    segContainerEl: any;
	    segContainerHeight: any;
	    innerEl: any;
	    bgSegContainerEl: any;
	    renderEventSkeleton(tr: any): void;
	    rangeToCoords(range: any): any;
	    componentFootprintToSegs(componentFootprint: any): any;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/row/ResourceRow' {
	import EventRow from 'fullcalendar-scheduler/src/resource-timeline/row/EventRow';
	export default class ResourceRow extends EventRow {
	    resource: any;
	    eventsPayload: any;
	    businessHourGenerator: any;
	    constructor(view: any, resource: any);
	    renderSkeleton(): void;
	    removeElement(): void;
	    renderEventSkeleton(tr: any): void;
	    executeEventRender(eventsPayload: any): void;
	    executeEventUnrender(): void;
	    renderBusinessHours(businessHourGenerator: any): void;
	    unrenderBusinessHours(): void;
	    renderSpreadsheetSkeleton(tr: any): void;
	    renderGutterHtml(): string;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/row/HRowGroup' {
	import RowGroup from 'fullcalendar-scheduler/src/resource-timeline/row/RowGroup';
	export default class HRowGroup extends RowGroup {
	    renderSkeleton(): void;
	    renderSpreadsheetSkeleton(tr: any): JQuery;
	    renderEventSkeleton(tr: any): any;
	}

}
declare module 'fullcalendar-scheduler/src/resource-timeline/ResourceTimelineView' {
	import ResourceComponentFootprint from 'fullcalendar-scheduler/src/models/ResourceComponentFootprint';
	import { ResourceViewInterface } from 'fullcalendar-scheduler/src/ResourceViewMixin';
	import TimelineView from 'fullcalendar-scheduler/src/timeline/TimelineView';
	import ResourceRow from 'fullcalendar-scheduler/src/resource-timeline/row/ResourceRow';
	import EventRow from 'fullcalendar-scheduler/src/resource-timeline/row/EventRow';
	export default class ResourceTimelineView extends TimelineView {
	    initResourceView: ResourceViewInterface['initResourceView'];
	    getResourceTextFunc: ResourceViewInterface['getResourceTextFunc'];
	    canHandleSpecificResources: boolean;
	    isResourceFootprintsEnabled: boolean;
	    eventRendererClass: any;
	    timeBodyTbodyEl: any;
	    spreadsheet: any;
	    dividerEls: any;
	    dividerWidth: any;
	    superHeaderText: any;
	    isVGrouping: any;
	    isHGrouping: any;
	    groupSpecs: any;
	    colSpecs: any;
	    orderSpecs: any;
	    tbodyHash: any;
	    rowHierarchy: any;
	    resourceRowHash: {
	        [resourceId: string]: ResourceRow;
	    };
	    nestingCnt: number;
	    isNesting: any;
	    eventRows: any;
	    shownEventRows: any;
	    resourceScrollJoiner: any;
	    rowsNeedingHeightSync: any;
	    rowCoordCache: any;
	    indiBizCnt: number;
	    isIndiBizRendered: boolean;
	    isGenericBizRendered: boolean;
	    genericBiz: any;
	    constructor(calendar: any, viewSpec: any);
	    processResourceOptions(): void;
	    renderSkeleton(): void;
	    renderSkeletonHtml(): string;
	    initDividerMoving(): void;
	    dividerMousedown(ev: any): void;
	    getNaturalDividerWidth(): any;
	    positionDivider(w: any): void;
	    updateSize(totalHeight: any, isAuto: any, isResize: any): void;
	    queryMiscHeight(): number;
	    syncHeadHeights(): number;
	    queryResourceScroll(): any;
	    applyResourceScroll(scroll: any): void;
	    scrollToResource(resource: any): void;
	    prepareHits(): void;
	    releaseHits(): void;
	    queryHit(leftOffset: any, topOffset: any): any;
	    getHitFootprint(hit: any): ResourceComponentFootprint;
	    getHitEl(hit: any): any;
	    renderResources(resources: any): void;
	    unrenderResources(): void;
	    renderResource(resource: any): void;
	    unrenderResource(resource: any): void;
	    executeEventRender(eventsPayload: any): void;
	    renderBusinessHours(businessHourGenerator: any): void;
	    updateIndiBiz(): void;
	    insertResource(resource: any, parentResourceRow?: any): ResourceRow;
	    removeResource(resource: any): ResourceRow;
	    insertRow(row: any, parent?: any, groupSpecs?: any): void;
	    insertRowAsChild(row: any, parent: any): any;
	    computeChildRowPosition(child: any, parent: any): number;
	    compareResources(a: any, b: any): any;
	    ensureResourceGroup(row: any, parent: any, spec: any): any;
	    descendantAdded(row: any): void;
	    descendantRemoved(row: any): void;
	    descendantShown(row: any): void;
	    descendantHidden(row: any): void;
	    syncRowHeights(visibleRows?: any[], safe?: boolean): void;
	    getVisibleRows(): any[];
	    getEventRows(): EventRow[];
	    getResourceRow(resourceId: any): ResourceRow;
	    renderSelectionFootprint(componentFootprint: any): void;
	    renderEventResize(eventFootprints: any, seg: any, isTouch: any): void;
	    unrenderEventResize(): void;
	    renderDrag(eventFootprints: any, seg: any, isTouch: any): boolean;
	    unrenderDrag(): void;
	}

}
declare module 'fullcalendar-scheduler/src/types/input-types' {
	/// <reference types="jquery" />
	import * as moment from 'moment';
	import { BusinessHoursInput, EventOptionsBase } from 'fullcalendar';
	export interface ResourceInput {
	    id?: string;
	    title?: string;
	    eventColor?: string;
	    eventBackgroundColor?: string;
	    eventBorderColor?: string;
	    eventTextColor?: string;
	    eventClassName?: string | string[];
	    businessHours?: BusinessHoursInput;
	    children?: ResourceInput[];
	    parentId?: string;
	    parent?: ResourceInput;
	}
	export interface ResourceComplexInput extends EventOptionsBase, JQueryAjaxSettings {
	}
	export type ResourceFunctionCallback = (resources: ResourceInput[]) => void;
	export type ResourceFunction = (callback: ResourceFunctionCallback, start: moment.Moment, end: moment.Moment, timezone: string) => void;
	export type ResourceSourceInput = ResourceInput[] | ResourceFunction | ResourceComplexInput; module 'fullcalendar/src/types/input-types' {
	    interface DropInfo {
	        resourceId?: string;
	    }
	    interface OptionsInputBase {
	        schedulerLicenseKey?: string;
	        resourceAreaWidth?: number;
	        resourceLabelText?: string;
	        resourceColumns?: any;
	        resources?: ResourceSourceInput;
	        refetchResourcesOnNavigate?: boolean;
	        groupByResource?: boolean;
	        groupByDateAndResource?: boolean;
	        resourceOrder?: string;
	        resourceGroupField?: string;
	        resourceGroupText?: (groupValue: string) => string;
	        resourcesInitiallyExpanded?: boolean;
	        filterResourcesWithEvents?: boolean;
	        resourceText?: (resource: ResourceInput) => string;
	        resourceRender?: (resource: ResourceInput, labelTds: JQuery, bodyTds: JQuery) => void;
	        eventResourceEditable?: boolean;
	    }
	}

}
declare module 'fullcalendar-scheduler/src/exports' {
	export { ResourceInput, ResourceSourceInput } from 'fullcalendar-scheduler/src/types/input-types';

}
declare module 'fullcalendar-scheduler/src/models/Resource' {
	export default class Resource {
	    static extractIds(rawProps: any, calendar: any): any[];
	    static normalizeId(rawId: any): string;
	}

}
declare module 'fullcalendar-scheduler/src/models/ResourceManager' {
	/// <reference types="jquery" />
	import { Class, EmitterInterface } from 'fullcalendar';
	export default class ResourceManager extends Class {
	    static resourceGuid: number;
	    static ajaxDefaults: {
	        dataType: string;
	        cache: boolean;
	    };
	    on: EmitterInterface['on'];
	    one: EmitterInterface['one'];
	    off: EmitterInterface['off'];
	    trigger: EmitterInterface['trigger'];
	    triggerWith: EmitterInterface['triggerWith'];
	    hasHandlers: EmitterInterface['hasHandlers'];
	    calendar: any;
	    fetchId: number;
	    topLevelResources: any;
	    resourcesById: any;
	    fetching: any;
	    currentStart: any;
	    currentEnd: any;
	    constructor(calendar: any);
	    getResources(start: any, end: any): any;
	    fetchResources(start: any, end: any): JQueryPromise<{}>;
	    fetchResourceInputs(callback: any, start: any, end: any): void;
	    getResourceById(id: any): any;
	    getFlatResources(): any[];
	    initializeCache(): void;
	    setResources(resourceInputs: any): void;
	    resetCurrentResources(): void;
	    clear(): void;
	    addResource(resourceInput: any): any;
	    addResourceToIndex(resource: any): boolean;
	    addResourceToTree(resource: any): boolean;
	    removeResource(idOrResource: any): any;
	    removeResourceFromIndex(resourceId: any): any;
	    removeResourceFromTree(resource: any, siblings?: any): boolean;
	    buildResource(resourceInput: any): any;
	}

}
declare module 'fullcalendar-scheduler/src/Calendar' {
	import { EventObjectInput } from 'fullcalendar';
	import { ResourceInput } from 'fullcalendar-scheduler/src/types/input-types'; module 'fullcalendar/Calendar' {
	    interface Default {
	        resourceManager: any;
	        getResources(): ResourceInput[];
	        addResource(resourceInput: ResourceInput, scroll?: boolean): any;
	        removeResource(idOrResource: string | ResourceInput): any;
	        refetchResources(): any;
	        rerenderResources(): any;
	        buildSelectFootprint(zonedStartInput: any, zonedEndInput: any, resourceId?: string): any;
	        getResourceById(id: string): ResourceInput;
	        getEventResourceId(event: EventObjectInput): string;
	        getEventResourceIds(event: EventObjectInput): string[];
	        setEventResourceId(event: EventObjectInput, resourceId: string): any;
	        setEventResourceIds(event: EventObjectInput, resourceIds: string[]): any;
	        getResourceEvents(idOrResource: string | ResourceInput): EventObjectInput[];
	        getEventResource(idOrEvent: string | EventObjectInput): ResourceInput;
	        getEventResources(idOrEvent: string | EventObjectInput): ResourceInput[];
	    }
	}

}
declare module 'fullcalendar-scheduler/src/Constraints' {
	export {};

}
declare module 'fullcalendar-scheduler/src/license' {
	export function processLicenseKey(key: any, containerEl: any): any;
	export function isValidKey(key: any): boolean;
	export function isImmuneUrl(url: any): boolean;
	export function renderingWarningInContainer(messageHtml: any, containerEl: any): any;
	export function detectWarningInContainer(containerEl: any): boolean;

}
declare module 'fullcalendar-scheduler/src/View' {
	 module 'fullcalendar/View' {
	    interface Default {
	        canHandleSpecificResources: boolean;
	        watchResources(): any;
	        unwatchResources(): any;
	        getInitialResources(dateProfile: any): any;
	        bindResourceChanges(eventsPayload: any): any;
	        unbindResourceChanges(): any;
	        setResources(resources: any, eventsPayload: any): any;
	        unsetResources(): any;
	        resetResources(resources: any, eventsPayload: any): any;
	        addResource(resource: any, allResources: any, eventsPayload: any): any;
	        removeResource(resource: any, allResources: any, eventsPayload: any): any;
	        handleResourceAdd(resource: any): any;
	        handleResourceRemove(resource: any): any;
	        filterResourcesWithEvents(resources: any, eventsPayload: any): any;
	        eventsPayloadToRanges(eventsPayload: any): any;
	    }
	}
	export {};

}
declare module 'fullcalendar-scheduler/src/component/DateComponent' {
	 module 'fullcalendar/DateComponent' {
	    interface Default {
	        isResourceFootprintsEnabled: boolean;
	        renderResources(resources: any): any;
	        unrenderResources(): any;
	        renderResource(resource: any): any;
	        unrenderResource(resource: any): any;
	    }
	}
	export {};

}
declare module 'fullcalendar-scheduler/src/component/InteractiveDateComponent' {
	 module 'fullcalendar/InteractiveDateComponent' {
	    interface Default {
	        allowCrossResource: boolean;
	        isEventDefResourceEditable(eventDef: any): boolean;
	    }
	}
	export {};

}
declare module 'fullcalendar-scheduler/src/component/renderers/EventRenderer' {
	 module 'fullcalendar/EventRenderer' {
	    interface Default {
	        designatedResource: any;
	        currentResource: any;
	    }
	}
	export {};

}
declare module 'fullcalendar-scheduler/src/component/interactions/DateSelecting' {
	export {};

}
declare module 'fullcalendar-scheduler/src/component/interactions/EventDragging' {
	export {};

}
declare module 'fullcalendar-scheduler/src/component/interactions/EventResizing' {
	export {};

}
declare module 'fullcalendar-scheduler/src/component/interactions/ExternalDropping' {
	export {};

}
declare module 'fullcalendar-scheduler/src/models/EventSource' {
	export {};

}
declare module 'fullcalendar-scheduler/src/models/EventDef' {
	 module 'fullcalendar/EventDef' {
	    interface Default {
	        resourceIds: any;
	        resourceEditable: boolean;
	        hasResourceId(resourceId: any): any;
	        removeResourceId(resourceId: any): any;
	        addResourceId(resourceId: any): any;
	        getResourceIds(): any;
	    }
	}
	export {};

}
declare module 'fullcalendar-scheduler/src/models/EventDefMutation' {
	 module 'fullcalendar/EventDefMutation' {
	    interface Default {
	        oldResourceId: any;
	        newResourceId: any;
	    }
	}
	export {};

}
declare module 'fullcalendar-scheduler/src/timeline/config' {
	export {};

}
declare module 'fullcalendar-scheduler/src/resource-timeline/config' {
	export {};

}
declare module 'fullcalendar-scheduler/src/resource-basic/config' {
	export {};

}
declare module 'fullcalendar-scheduler/src/resource-agenda/config' {
	export {};

}
declare module 'fullcalendar-scheduler/src/types/jquery-hooks' {
	import { EventObjectInput } from 'fullcalendar';
	import { ResourceInput } from 'fullcalendar-scheduler/src/types/input-types'; global  {
	    interface JQuery {
	        fullCalendar(method: 'getResources'): ResourceInput[];
	        fullCalendar(method: 'addResource', resourceInput: ResourceInput, scroll?: boolean): JQuery;
	        fullCalendar(method: 'removeResource', idOrResource: string | ResourceInput): JQuery;
	        fullCalendar(method: 'refetchResources'): JQuery;
	        fullCalendar(method: 'rerenderResources'): JQuery;
	        fullCalendar(method: 'getResourceById', id: string): ResourceInput;
	        fullCalendar(method: 'getEventResourceId', event: EventObjectInput): string;
	        fullCalendar(method: 'getEventResourceIds', event: EventObjectInput): string[];
	        fullCalendar(method: 'setEventResourceId', event: EventObjectInput, resourceId: string): JQuery;
	        fullCalendar(method: 'setEventResourceIds', event: EventObjectInput, resourceIds: string[]): JQuery;
	        fullCalendar(method: 'getResourceEvents', idOrResource: string | ResourceInput): EventObjectInput[];
	        fullCalendar(method: 'getEventResource', idOrEvent: string | EventObjectInput): ResourceInput;
	        fullCalendar(method: 'getEventResources', idOrEvent: string | EventObjectInput): ResourceInput[];
	    }
	}

}
declare module 'fullcalendar-scheduler/src/main' {
	import 'fullcalendar-scheduler/src/exports';
	import 'fullcalendar-scheduler/src/Calendar';
	import 'fullcalendar-scheduler/src/Constraints';
	import 'fullcalendar-scheduler/src/View';
	import 'fullcalendar-scheduler/src/component/DateComponent';
	import 'fullcalendar-scheduler/src/component/InteractiveDateComponent';
	import 'fullcalendar-scheduler/src/component/renderers/EventRenderer';
	import 'fullcalendar-scheduler/src/component/interactions/DateSelecting';
	import 'fullcalendar-scheduler/src/component/interactions/EventDragging';
	import 'fullcalendar-scheduler/src/component/interactions/EventResizing';
	import 'fullcalendar-scheduler/src/component/interactions/ExternalDropping';
	import 'fullcalendar-scheduler/src/models/EventSource';
	import 'fullcalendar-scheduler/src/models/EventDef';
	import 'fullcalendar-scheduler/src/models/EventDefMutation';
	import 'fullcalendar-scheduler/src/timeline/config';
	import 'fullcalendar-scheduler/src/resource-timeline/config';
	import 'fullcalendar-scheduler/src/resource-basic/config';
	import 'fullcalendar-scheduler/src/resource-agenda/config';
	import 'fullcalendar-scheduler/src/types/input-types';
	import 'fullcalendar-scheduler/src/types/jquery-hooks';

}
declare module 'fullcalendar-scheduler' {
	import main = require('fullcalendar-scheduler/src/main');
	export = main;
}
