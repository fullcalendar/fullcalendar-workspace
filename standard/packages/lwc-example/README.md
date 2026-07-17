# FullCalendar LWC Example

This package is the local Salesforce smoke-test app for `@fullcalendar/lwc`.
It intentionally lives in its own sibling package so Salesforce CLI only sees one Salesforce project configuration here: `force-app`.
The `force-app` tree symlinks `lwc/fullCalendar` and `staticresources/fullCalendarLib*` to `../lwc/dist/src-sfdx/...`, so there is no copy step.
The deploy commands use Salesforce CLI (`sf`), which this package expects via the npm package `@salesforce/cli`.
`smoke:deploy` targets the `fullcalendar-dev` org alias directly so it does not depend on whatever global default org happens to be configured.

## Flow

1. Run `pnpm install` at the repo root so `@salesforce/cli` is available to this package.
2. `cd standard/packages/lwc`.
3. Run `pnpm build` to refresh `dist`.
4. `cd ../lwc-example`.
5. If needed, run `pnpm run smoke:login` to log into a Salesforce org and save it as the `fullcalendar-dev` alias.
6. Optionally run `pnpm run smoke:orgs` to confirm that `fullcalendar-dev` is available.
7. Run `pnpm run smoke:deploy`.
8. Add the `calendarDemo` component to a Lightning app page in the deployed org and verify that the calendar renders with the expected theme, palette, locale, and sample events.

If `../lwc/dist/` has been cleaned or is out of date, run `pnpm build` from `standard/packages/lwc`; the example symlinks will point at the refreshed output automatically.
