declare module "@fullcalendar/resource-daygrid/ResourceDayGrid" {
    import { Hit, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, Duration } from "@fullcalendar/core";
    import { DayGrid } from "@fullcalendar/daygrid";
    import { AbstractResourceDayTable } from "@fullcalendar/resource-common";
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
    export { ResourceDayGrid as default, ResourceDayGrid };
    class ResourceDayGrid extends DateComponent<ResourceDayGridProps> {
        dayGrid: DayGrid;
        private splitter;
        private slicers;
        private joiner;
        constructor(context: ComponentContext, dayGrid: DayGrid);
        destroy(): void;
        render(props: ResourceDayGridProps): void;
        queryHit(positionLeft: number, positionTop: number): Hit;
    }
}

declare module "@fullcalendar/resource-daygrid/ResourceDayGridView" {
    import { ComponentContext, ViewSpec, DateProfileGenerator } from "@fullcalendar/core";
    import { AbstractDayGridView } from "@fullcalendar/daygrid";
    import { ResourceDayHeader, ResourceViewProps } from "@fullcalendar/resource-common";
    import ResourceDayGrid from "@fullcalendar/resource-daygrid/ResourceDayGrid";
    export { ResourceDayGridView as default, ResourceDayGridView };
    class ResourceDayGridView extends AbstractDayGridView {
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

declare module "@fullcalendar/resource-daygrid" {
    import ResourceDayGridView from "@fullcalendar/resource-daygrid/ResourceDayGridView";
    export { ResourceDayGridView };
    export { default as ResourceDayGrid } from "@fullcalendar/resource-daygrid/ResourceDayGrid";
    const _default_1: import("@fullcalendar/core").PluginDef;
    export default _default_1;
}