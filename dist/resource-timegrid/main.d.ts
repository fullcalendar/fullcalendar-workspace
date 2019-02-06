declare module "@fullcalendar/resource-timegrid/ResourceTimeGrid" {
    import { DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, DateMarker, Hit } from "@fullcalendar/core";
    import { TimeGrid } from "@fullcalendar/timegrid";
    import { AbstractResourceDayTable } from "@fullcalendar/resource-common";
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
    export { ResourceTimeGrid as default, ResourceTimeGrid };
    class ResourceTimeGrid extends DateComponent<ResourceTimeGridProps> {
        timeGrid: TimeGrid;
        private buildDayRanges;
        private dayRanges;
        private splitter;
        private slicers;
        private joiner;
        constructor(context: ComponentContext, timeGrid: TimeGrid);
        destroy(): void;
        render(props: ResourceTimeGridProps): void;
        renderNowIndicator(date: DateMarker): void;
        queryHit(positionLeft: number, positionTop: number): Hit;
    }
}

declare module "@fullcalendar/resource-timegrid/ResourceTimeGridView" {
    import { ComponentContext, ViewSpec, DateProfileGenerator } from "@fullcalendar/core";
    import { AbstractTimeGridView } from "@fullcalendar/timegrid";
    import { ResourceDayHeader, ResourceViewProps } from "@fullcalendar/resource-common";
    import { ResourceDayGrid } from "@fullcalendar/resource-daygrid";
    import ResourceTimeGrid from "@fullcalendar/resource-timegrid/ResourceTimeGrid";
    export { ResourceTimeGridView as default, ResourceTimeGridView };
    class ResourceTimeGridView extends AbstractTimeGridView {
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

declare module "@fullcalendar/resource-timegrid" {
    import ResourceTimeGridView from "@fullcalendar/resource-timegrid/ResourceTimeGridView";
    export { ResourceTimeGridView };
    export { default as ResourceTimeGrid } from "@fullcalendar/resource-timegrid/ResourceTimeGrid";
    const _default_2: import("@fullcalendar/core").PluginDef;
    export default _default_2;
}