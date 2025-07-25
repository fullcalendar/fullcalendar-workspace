STRATEGY FOR COMPILING THEME SOURCE CODE TO A SINGLE INLINED REACT COMPONENT

- Inline all theming and slot logic from theme packages, but do NOT inline core or connector packages (e.g., @fullcalendar/core, @fullcalendar/react).
- Inline all option objects (e.g., baseEventCalendarOptions, defaultUiEventCalendarOptions) as explicit JSX props on the main component, not as object spreads.
- Merge user options shallowly: spread user props (e.g., {...options}) before custom props to avoid overwriting custom logic.
- For the 'views' prop, merge user and theme options per-view (e.g., dayGrid, timeGrid, etc.), spreading user options first, then theme defaults/overrides.
- Use top-level constants for all constant values (e.g., colors, class names, static option values).
- DRY: Use variables for repeated logic/functions (e.g., rowItemClasses, getWeekNumberBadgeClasses), do not inline the same logic in multiple places.
- Inline JSX-generating functions (e.g., dayHeaderContent) directly as JSX props, not as separate variables.
- Remove all unused variables and code after inlining or refactoring.
- Use concise JSX for string literals (e.g., className="foo" not className={"foo"}).
- Do NOT leave any intermediate, inlining, or strategy comments in the code body—keep the output clean and production-ready.
- Keep the output idiomatic for React and easy to maintain.
- Always clean up after inlining or refactoring, ensuring no dead code remains.
- Prefer explicitness and maintainability over cleverness or terseness.
- When using FullCalendar plugins (such as timeline, resource, adaptive, etc.), you must explicitly import them and include them in the plugins={[]} prop of the generated component. This is required for correct operation and is not handled automatically by FullCalendar.

This strategy ensures the resulting file is a single, self-contained, idiomatic React component that is easy to read, maintain, and override.
