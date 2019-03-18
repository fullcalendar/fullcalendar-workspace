declare module "@fullcalendar/resource-common/structs/resource" {
    import { ConstraintInput, AllowFunc, EventStore, Calendar, EventUi, BusinessHoursInput } from "@fullcalendar/core";
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

declare module "@fullcalendar/resource-common/resource-sources/resource-func" {
    import { ResourceSourceError } from "@fullcalendar/resource-common/structs/resource-source";
    import { ResourceInput } from "@fullcalendar/resource-common/structs/resource";
    export type ResourceFunc = (arg: {
        start: Date;
        end: Date;
        timeZone: string;
    }, successCallback: (events: ResourceInput[]) => void, failureCallback: (errorObj: ResourceSourceError) => void) => any;
}

declare module "@fullcalendar/resource-common/structs/resource-source" {
    import { DateRange, Calendar } from "@fullcalendar/core";
    import { ResourceInput } from "@fullcalendar/resource-common/structs/resource";
    import { ResourceFunc } from "@fullcalendar/resource-common/resource-sources/resource-func";
    export type ResourceSourceError = {
        message: string;
        xhr?: XMLHttpRequest;
        [otherProp: string]: any;
    };
    export type ResourceFetcher = (arg: {
        resourceSource: ResourceSource;
        calendar: Calendar;
        range: DateRange | null;
    }, success: (res: {
        rawResources: ResourceInput[];
        xhr?: XMLHttpRequest;
    }) => void, failure: (error: ResourceSourceError) => void) => void;
    export interface ExtendedResourceSourceInput {
        id?: string;
        resources?: ResourceInput[];
        url?: string;
        method?: string;
        extraParams?: object | (() => object);
    }
    export type ResourceSourceInput = ResourceInput[] | ExtendedResourceSourceInput | ResourceFunc | string;
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

declare module "@fullcalendar/resource-common/reducers/resourceSource" {
    import { Calendar, DateProfile } from "@fullcalendar/core";
    import { ResourceSource } from "@fullcalendar/resource-common/structs/resource-source";
    import { ResourceAction } from "@fullcalendar/resource-common/reducers/resources";
    export default function (source: ResourceSource | undefined, action: ResourceAction, dateProfile: DateProfile, calendar: Calendar): ResourceSource | null;
}

declare module "@fullcalendar/resource-common/reducers/resourceStore" {
    import { Calendar } from "@fullcalendar/core";
    import { ResourceAction } from "@fullcalendar/resource-common/reducers/resources";
    import { ResourceHash } from "@fullcalendar/resource-common/structs/resource";
    import { ResourceSource } from "@fullcalendar/resource-common/structs/resource-source";
    export default function (store: ResourceHash | undefined, action: ResourceAction, source: ResourceSource, calendar: Calendar): ResourceHash;
}

declare module "@fullcalendar/resource-common/reducers/resources" {
    import { Calendar, CalendarState, Action, DateRange } from "@fullcalendar/core";
    import { ResourceSource, ResourceSourceError } from "@fullcalendar/resource-common/structs/resource-source";
    import { ResourceHash, ResourceInput } from "@fullcalendar/resource-common/structs/resource";
    import { ResourceEntityExpansions } from "@fullcalendar/resource-common/reducers/resourceEntityExpansions";
    module '@fullcalendar/core' {
        interface CalendarState {
            resourceSource?: ResourceSource | null;
            resourceStore?: ResourceHash;
            resourceEntityExpansions?: ResourceEntityExpansions;
        }
    }
    module '@fullcalendar/core' {
        interface Calendar {
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
        eventSources: import("@fullcalendar/core").EventSourceHash;
        eventSourceLoadingLevel: number;
        loadingLevel: number;
        viewType: string;
        currentDate: Date;
        dateProfile: import("@fullcalendar/core").DateProfile;
        eventStore: import("@fullcalendar/core").EventStore;
        dateSelection: import("@fullcalendar/core").DateSpan;
        eventSelection: string;
        eventDrag: import("@fullcalendar/core").EventInteractionState;
        eventResize: import("@fullcalendar/core").EventInteractionState;
    };
}

declare module "@fullcalendar/resource-common/reducers/resourceEntityExpansions" {
    import { ResourceAction } from "@fullcalendar/resource-common/reducers/resources";
    export type ResourceEntityExpansions = {
        [id: string]: boolean;
    };
    export function reduceResourceEntityExpansions(expansions: ResourceEntityExpansions, action: ResourceAction): ResourceEntityExpansions;
}

declare module "@fullcalendar/resource-common/View" {
    import { View, ViewProps, ViewSpec, ViewPropsTransformer, CalendarComponentProps, EventUi, EventUiHash, EventDefHash, EventStore, DateRange } from "@fullcalendar/core";
    import { ResourceHash } from "@fullcalendar/resource-common/structs/resource";
    import { ResourceEntityExpansions } from "@fullcalendar/resource-common/reducers/resourceEntityExpansions";
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
    }
    function filterResources(resourceStore: ResourceHash, doFilterResourcesWithEvents: boolean, eventStore: EventStore, activeRange: DateRange): ResourceHash;
    export class ResourceEventConfigAdder implements ViewPropsTransformer {
        buildResourceEventUis: typeof buildResourceEventUis;
        injectResourceEventUis: typeof injectResourceEventUis;
        transform(viewProps: ViewProps, viewSpec: ViewSpec, calendarProps: CalendarComponentProps): {
            eventUiBases: {
                [key: string]: EventUi;
            };
        };
    }
    function buildResourceEventUis(resourceStore: ResourceHash): {
        [key: string]: EventUi;
    };
    function injectResourceEventUis(eventUiBases: EventUiHash, eventDefs: EventDefHash, resourceEventUis: EventUiHash): {
        [key: string]: EventUi;
    };
}

declare module "@fullcalendar/resource-common/structs/event" {
    import { EventDef } from "@fullcalendar/core";
    module '@fullcalendar/core' {
        interface EventDef {
            resourceIds: string[];
            resourceEditable: boolean;
        }
    }
    export function parseEventDef(def: EventDef, props: any, leftovers: any): void;
}

declare module "@fullcalendar/resource-common/EventDragging" {
    import { EventMutation, Hit, EventDef, Calendar } from "@fullcalendar/core";
    module '@fullcalendar/core' {
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
    export function transformEventDrop(mutation: EventMutation, calendar: Calendar): {
        oldResource: import("@fullcalendar/resource-common").ResourceApi;
        newResource: import("@fullcalendar/resource-common").ResourceApi;
    };
}

declare module "@fullcalendar/resource-common/DateSelecting" {
    import { Hit } from "@fullcalendar/core";
    export function transformDateSelectionJoin(hit0: Hit, hit1: Hit): false | {
        resourceId: any;
    };
}

declare module "@fullcalendar/resource-common/api/ResourceApi" {
    import { Calendar, EventApi } from "@fullcalendar/core";
    import { Resource } from "@fullcalendar/resource-common/structs/resource";
    export { ResourceApi as default, ResourceApi };
    class ResourceApi {
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
        readonly eventConstraint: any;
        readonly eventOverlap: any;
        readonly eventAllow: any;
        readonly eventBackgroundColor: string;
        readonly eventBorderColor: string;
        readonly eventTextColor: string;
        readonly eventClassNames: string[];
        readonly extendedProps: any;
    }
}

declare module "@fullcalendar/resource-common/Calendar" {
    import { DateSpan, Calendar } from "@fullcalendar/core";
    import ResourceApi from "@fullcalendar/resource-common/api/ResourceApi";
    import { ResourceInput } from "@fullcalendar/resource-common/structs/resource";
    import { ResourceSourceInput } from "@fullcalendar/resource-common/structs/resource-source";
    module '@fullcalendar/core' {
        interface DatePointApi {
            resource?: ResourceApi;
        }
        interface DateSpanApi {
            resource?: ResourceApi;
        }
        interface Calendar {
            addResource(input: ResourceInput): ResourceApi;
            getResourceById(id: string): ResourceApi | null;
            getResources(): ResourceApi[];
            getTopLevelResources(): ResourceApi[];
            rerenderResources(): void;
            refetchResources(): void;
        }
        interface OptionsInput {
            schedulerLicenseKey?: string;
            resources?: ResourceSourceInput;
            resourceLabelText?: string;
            resourceOrder?: any;
            filterResourcesWithEvents?: any;
            resourceText?: any;
            resourceRender?: any;
            resourceGroupField?: any;
            resourceGroupText?: any;
            resourceAreaWidth?: any;
            resourceColumns?: any;
            resourcesInitiallyExpanded?: any;
            slotWidth?: any;
            datesAboveResources?: any;
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

declare module "@fullcalendar/resource-common/common/ResourceSplitter" {
    import { Splitter, SplittableProps, DateSpan, EventDef } from "@fullcalendar/core";
    import { ResourceHash } from "@fullcalendar/resource-common/structs/resource";
    export interface SplittableResourceProps extends SplittableProps {
        resourceStore: ResourceHash;
    }
    export { ResourceSplitter as default, ResourceSplitter };
    class ResourceSplitter extends Splitter<SplittableResourceProps> {
        getKeyInfo(props: SplittableResourceProps): {
            '': {};
        };
        getKeysForDateSpan(dateSpan: DateSpan): string[];
        getKeysForEventDef(eventDef: EventDef): string[];
    }
}

declare module "@fullcalendar/resource-common/validation" {
    import { SplittableProps, Calendar } from "@fullcalendar/core";
    export function isPropsValidWithResources(props: SplittableProps, calendar: Calendar): boolean;
}

declare module "@fullcalendar/resource-common/ExternalElementDragging" {
    import { DateSpan } from "@fullcalendar/core";
    export function transformExternalDef(dateSpan: DateSpan): {
        resourceId: any;
    } | {
        resourceId?: undefined;
    };
}

declare module "@fullcalendar/resource-common/EventResizing" {
    import { Hit } from "@fullcalendar/core";
    export function transformEventResizeJoin(hit0: Hit, hit1: Hit): false | object;
}

declare module "@fullcalendar/resource-common/api/EventApi" {
    import ResourceApi from "@fullcalendar/resource-common/api/ResourceApi";
    module '@fullcalendar/core' {
        interface EventApi {
            getResources: () => ResourceApi[];
        }
    }
}

declare module "@fullcalendar/resource-common/license" {
    import { Calendar } from "@fullcalendar/core";
    export function injectLicenseWarning(containerEl: HTMLElement, calendar: Calendar): void;
}

declare module "@fullcalendar/resource-common/resource-sources/resource-array" { }

declare module "@fullcalendar/resource-common/resource-sources/resource-json-feed" { }

declare module "@fullcalendar/resource-common/common/resource-rendering" {
    import { Resource } from "@fullcalendar/resource-common/structs/resource";
    export function buildResourceTextFunc(resourceTextSetting: any, calendar: any): (resource: Resource) => any;
}

declare module "@fullcalendar/resource-common/common/ResourceDayHeader" {
    import { Component, ComponentContext, DateMarker, DateProfile, DateFormatter } from "@fullcalendar/core";
    import { Resource } from "@fullcalendar/resource-common/structs/resource";
    export interface ResourceDayHeaderProps {
        dates: DateMarker[];
        dateProfile: DateProfile;
        datesRepDistinctDays: boolean;
        resources: Resource[];
        renderIntroHtml?: () => string;
    }
    export { ResourceDayHeader as default, ResourceDayHeader };
    class ResourceDayHeader extends Component<ResourceDayHeaderProps> {
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

declare module "@fullcalendar/resource-common/common/resource-day-table" {
    import { SlicedProps, EventDef, Splitter, DayTable, DayTableCell, SplittableProps, DateSpan, Seg, EventSegUiInteractionState } from "@fullcalendar/core";
    import { Resource } from "@fullcalendar/resource-common/structs/resource";
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

declare module "@fullcalendar/resource-common/common/resource-hierarchy" {
    import { ResourceHash, Resource } from "@fullcalendar/resource-common/structs/resource";
    import { ResourceEntityExpansions } from "@fullcalendar/resource-common/reducers/resourceEntityExpansions";
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
        businessHours: import("@fullcalendar/core").EventStore;
        ui: import("@fullcalendar/core").EventUi;
        extendedProps: {
            [extendedProp: string]: any;
        };
        startEditable: boolean;
        durationEditable: boolean;
        constraints: import("@fullcalendar/core").Constraint[];
        overlap: boolean;
        allows: import("@fullcalendar/core").AllowFunc[];
        backgroundColor: string;
        borderColor: string;
        textColor: string;
        classNames: string[];
    };
    export function isGroupsEqual(group0: Group, group1: Group): boolean;
}

declare module "@fullcalendar/resource-common" {
    import "@fullcalendar/resource-common/api/EventApi";
    import "@fullcalendar/resource-common/resource-sources/resource-array";
    import "@fullcalendar/resource-common/resource-sources/resource-func";
    import "@fullcalendar/resource-common/resource-sources/resource-json-feed";
    const _default: import("@fullcalendar/core").PluginDef;
    export default _default;
    export { default as ResourceDayHeader } from "@fullcalendar/resource-common/common/ResourceDayHeader";
    export { VResourceJoiner, AbstractResourceDayTable, ResourceDayTable, DayResourceTable, VResourceSplitter } from "@fullcalendar/resource-common/common/resource-day-table";
    export { Resource, ResourceHash } from "@fullcalendar/resource-common/structs/resource";
    export { ResourceViewProps } from "@fullcalendar/resource-common/View";
    export { flattenResources, Group, isGroupsEqual, GroupNode, ResourceNode, buildRowNodes, buildResourceFields } from "@fullcalendar/resource-common/common/resource-hierarchy";
    export { buildResourceTextFunc } from "@fullcalendar/resource-common/common/resource-rendering";
    export { default as ResourceApi } from "@fullcalendar/resource-common/api/ResourceApi";
    export { computeResourceEditable } from "@fullcalendar/resource-common/EventDragging";
    export { default as ResourceSplitter } from "@fullcalendar/resource-common/common/ResourceSplitter";
}