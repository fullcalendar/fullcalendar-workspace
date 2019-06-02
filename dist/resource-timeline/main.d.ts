declare module "@fullcalendar/resource-timeline/Row" {
    import { Component, ComponentContext } from "@fullcalendar/core";
    export { Row as default, Row };
    abstract class Row<PropsType> extends Component<PropsType> {
        spreadsheetTr: HTMLElement;
        timeAxisTr: HTMLElement;
        isSizeDirty: boolean;
        constructor(context: ComponentContext, spreadsheetParent: HTMLElement, spreadsheetNextSibling: HTMLElement, timeAxisParent: HTMLElement, timeAxisNextSibling: HTMLElement);
        destroy(): void;
        abstract getHeightEls(): HTMLElement[];
        updateSize(isResize: boolean): void;
    }
}

declare module "@fullcalendar/resource-timeline/render-utils" {
    export function updateExpanderIcon(el: HTMLElement, isExpanded: boolean): void;
    export function clearExpanderIcon(el: HTMLElement): void;
    export function updateTrResourceId(tr: HTMLElement, resourceId: string): void;
}

declare module "@fullcalendar/resource-timeline/GroupRow" {
    import { Group } from "@fullcalendar/resource-common";
    import Row from "@fullcalendar/resource-timeline/Row";
    export interface GroupRowProps {
        spreadsheetColCnt: number;
        id: string;
        isExpanded: boolean;
        group: Group;
    }
    export { GroupRow as default, GroupRow };
    class GroupRow extends Row<GroupRowProps> {
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

declare module "@fullcalendar/resource-timeline/SpreadsheetRow" {
    import { Component, ComponentContext } from "@fullcalendar/core";
    import { Resource } from "@fullcalendar/resource-common";
    export interface SpreadsheetRowProps {
        colSpecs: any;
        id: string;
        rowSpans: number[];
        depth: number;
        isExpanded: boolean;
        hasChildren: boolean;
        resource: Resource;
    }
    export { SpreadsheetRow as default, SpreadsheetRow };
    class SpreadsheetRow extends Component<SpreadsheetRowProps> {
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

declare module "@fullcalendar/resource-timeline/ResourceRow" {
    import { Duration, ComponentContext, EventInteractionState, DateSpan, EventUiHash, EventStore, DateProfile } from "@fullcalendar/core";
    import { TimelineLane, TimeAxis } from "@fullcalendar/timeline";
    import Row from "@fullcalendar/resource-timeline/Row";
    import SpreadsheetRow from "@fullcalendar/resource-timeline/SpreadsheetRow";
    import { Resource } from "@fullcalendar/resource-common";
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
    export { ResourceRow as default, ResourceRow };
    class ResourceRow extends Row<ResourceRowProps> {
        innerContainerEl: HTMLElement;
        spreadsheetRow: SpreadsheetRow;
        lane: TimelineLane;
        private _updateTrResourceId;
        constructor(context: ComponentContext, a: any, b: any, c: any, d: any, timeAxis: TimeAxis);
        destroy(): void;
        render(props: ResourceRowProps): void;
        updateSize(isResize: boolean): void;
        getHeightEls(): HTMLElement[];
    }
}

declare module "@fullcalendar/resource-timeline/SpreadsheetHeader" {
    import { ElementDragging, Component, ComponentContext, EmitterMixin } from "@fullcalendar/core";
    export interface SpreadsheetHeaderProps {
        superHeaderText: string;
        colSpecs: any;
        colTags: string;
    }
    export { SpreadsheetHeader as default, SpreadsheetHeader };
    class SpreadsheetHeader extends Component<SpreadsheetHeaderProps> {
        tableEl: HTMLElement;
        resizerEls: HTMLElement[];
        resizables: ElementDragging[];
        thEls: HTMLElement[];
        colEls: HTMLElement[];
        colWidths: number[];
        emitter: EmitterMixin;
        constructor(context: ComponentContext, parentEl: HTMLElement);
        destroy(): void;
        render(props: SpreadsheetHeaderProps): void;
        initColResizing(): void;
    }
}

declare module "@fullcalendar/resource-timeline/Spreadsheet" {
    import { Component, ComponentContext } from "@fullcalendar/core";
    import { HeaderBodyLayout } from "@fullcalendar/timeline";
    import SpreadsheetHeader from "@fullcalendar/resource-timeline/SpreadsheetHeader";
    export interface SpreadsheetProps {
        superHeaderText: string;
        colSpecs: any;
    }
    export { Spreadsheet as default, Spreadsheet };
    class Spreadsheet extends Component<SpreadsheetProps> {
        header: SpreadsheetHeader;
        layout: HeaderBodyLayout;
        bodyContainerEl: HTMLElement;
        bodyColGroup: HTMLElement;
        bodyTbody: HTMLElement;
        bodyColEls: HTMLElement[];
        private _renderCells;
        constructor(context: ComponentContext, headParentEl: HTMLElement, bodyParentEl: HTMLElement);
        destroy(): void;
        render(props: SpreadsheetProps): void;
        renderCells(superHeaderText: any, colSpecs: any): void;
        unrenderCells(): void;
        renderColTags(colSpecs: any): string;
        updateSize(isResize: any, totalHeight: any, isAuto: any): void;
        applyColWidths(colWidths: (number | string)[]): void;
    }
}

declare module "@fullcalendar/resource-timeline/ResourceTimelineView" {
    import { ElementDragging, SplittableProps, PositionCache, Hit, View, ViewSpec, ComponentContext, DateProfileGenerator, DateProfile } from "@fullcalendar/core";
    import { ScrollJoiner, TimelineLane, StickyScroller, TimeAxis } from "@fullcalendar/timeline";
    import { GroupNode, ResourceNode, ResourceViewProps } from "@fullcalendar/resource-common";
    import GroupRow from "@fullcalendar/resource-timeline/GroupRow";
    import ResourceRow from "@fullcalendar/resource-timeline/ResourceRow";
    import Spreadsheet from "@fullcalendar/resource-timeline/Spreadsheet";
    export { ResourceTimelineView as default, ResourceTimelineView };
    class ResourceTimelineView extends View {
        static needsResourceData: boolean;
        props: ResourceViewProps;
        spreadsheet: Spreadsheet;
        timeAxis: TimeAxis;
        lane: TimelineLane;
        bodyScrollJoiner: ScrollJoiner;
        spreadsheetBodyStickyScroller: StickyScroller;
        isStickyScrollDirty: boolean;
        timeAxisTbody: HTMLElement;
        miscHeight: number;
        rowNodes: (GroupNode | ResourceNode)[];
        rowComponents: (GroupRow | ResourceRow)[];
        rowComponentsById: {
            [id: string]: (GroupRow | ResourceRow);
        };
        resourceAreaHeadEl: HTMLElement;
        resourceAreaWidth?: number;
        resourceAreaWidthDraggings: ElementDragging[];
        superHeaderText: any;
        isVGrouping: any;
        isHGrouping: any;
        groupSpecs: any;
        colSpecs: any;
        orderSpecs: any;
        rowPositions: PositionCache;
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
        applyScroll(scroll: any, isResize: any): void;
        computeDateScroll(timeMs: number): {
            left: number;
        };
        queryDateScroll(): {
            left: number;
        };
        applyDateScroll(scroll: any): void;
        queryResourceScroll(): any;
        applyResourceScroll(scroll: any): void;
        buildPositionCaches(): void;
        queryHit(positionLeft: number, positionTop: number): Hit;
        setResourceAreaWidth(widthVal: any): void;
        initResourceAreaWidthDragging(): void;
    }
}

declare module "@fullcalendar/resource-timeline" {
    import ResourceTimelineView from "@fullcalendar/resource-timeline/ResourceTimelineView";
    export { ResourceTimelineView };
    const _default_5: import("@fullcalendar/core").PluginDef;
    export default _default_5;
}