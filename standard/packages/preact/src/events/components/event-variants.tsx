import { EventVariant } from './ForegroundEvent'
import { EventEdge, EventInner, EventPartProps } from './event-parts'
import { useViewOptions } from '../../context/useGranularContexts'
import classNames from '../../styles.module.css'

// the foreground event variants: each a set of class layers and a composed body

// DayGrid block events, the TimeGrid all-day row, Timeline
export const rowEventVariant: EventVariant = {
  layers: ['blockEvent', 'rowEvent'],
  className: classNames.flexRow,
  getTitleClassName: (options) => options.rowEventTitleSticky ? classNames.stickyS : undefined,
  Body: function RowEventBody({ props, display }: EventPartProps) {
    const options = useViewOptions()

    return (
      <>
        {display.renderProps.isSelected && <div className={classNames.hitY} />}
        <EventEdge
          edge="start"
          axis="x"
          props={props}
          display={display}
          content={options.rowEventBeforeContent}
        />
        <EventInner props={props} display={display} />
        <EventEdge
          edge="end"
          axis="x"
          props={props}
          display={display}
          content={options.rowEventAfterContent}
        />
      </>
    )
  },
}

// TimeGrid timed events
export const columnEventVariant: EventVariant = {
  layers: ['blockEvent', 'columnEvent'],
  className: classNames.flexCol,
  getTitleClassName: (options) => options.columnEventTitleSticky ? classNames.stickyT : undefined,
  Body: function ColumnEventBody({ props, display }: EventPartProps) {
    return (
      <>
        {display.renderProps.isSelected && <div className={classNames.hitX} />}
        <EventEdge edge="start" axis="y" props={props} display={display} />
        <EventInner props={props} display={display} />
        <EventEdge edge="end" axis="y" props={props} display={display} />
      </>
    )
  },
}

// List view, DayGrid dot events
export const listItemEventVariant: EventVariant = {
  layers: ['listItemEvent'],
  className: classNames.flexRow,
  Body: function ListItemEventBody({ props, display }: EventPartProps) {
    return (
      <>
        <EventEdge edge="start" axis="x" props={props} display={display} />
        <EventInner props={props} display={display} />
        <EventEdge edge="end" axis="x" props={props} display={display} />
      </>
    )
  },
}
