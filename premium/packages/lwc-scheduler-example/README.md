# FullCalendar LWC Scheduler Example

This package is the local Salesforce smoke-test app for `@fullcalendar/lwc-scheduler`. Its `force-app` tree symlinks the generated component and both generated static resources from `../lwc-scheduler/dist/src-sfdx`.

## Flow

1. Run `pnpm install` at the repository root.
2. `cd premium/packages/lwc-scheduler`.
3. Run `pnpm build` to refresh `dist`.
4. `cd ../lwc-scheduler-example`.
5. If needed, run `pnpm run smoke:login` to save a Salesforce org as `fullcalendar-scheduler-dev`.
6. Run `pnpm run smoke:deploy`.
7. Add the `calendarDemo` component to a Lightning app page and verify the resource timeline, theme, locale, events, and license behavior.
