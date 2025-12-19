
# Full UI :: Headless Grid

Headless datagrid library by the makers of FullCalendar

## Description

This "headless" library provides a very minimal set of primitives to render a JavaScript data grid using DOM-related optimizations like absolute positioning and scroll-simulation, which are traditionally the thorniest aspects of making a performant grid. It intends to be utility-first, like Tanstack Table, though in some aspects it must perform framework-dependent optimizations to achieve 60 FPS.

[!IMPORTANT]
If you are a FullCalendar Premium subscriber, and wish to use this library, please reach out to the tech support email you received upon purchase.

In its current form, it's being used internally by the `@fullcalendar/resource-timeline` package, which renders a timeline view alongside a FullCalendar-built datagrid. Our goal is to make the *FullCalendar* datagrid the best in the world, though in the meantime, many users will want to use a datagrid of their choosing and integrate it with Resource-Timeline. This is the dual-purpose of this package: to allow shimming of third-party data grid libraries into FullCalendar's UI.

## High-level API

- Column absolute positioning
- Row absolute positioning
- Scroll-view syncing across unrelated parents
- Virtual rendering (soon)
- A little bit of cross-framework magic

And more to come!... 👀
