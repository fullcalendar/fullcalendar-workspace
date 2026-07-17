# FullCalendar LWC Scheduler Example

This package is the local Salesforce smoke-test app for `@fullcalendar/lwc-scheduler`.
It intentionally lives in its own sibling package so Salesforce CLI only sees one Salesforce project configuration here: `force-app`.
The `force-app` tree symlinks `lwc/fullCalendarScheduler` and both `staticresources/fullCalendarLib*` and `staticresources/fullCalendarSchedulerLib*` to `../lwc-scheduler/dist/src-sfdx/...`, so there is no copy step.
The deploy commands use Salesforce CLI (`sf`), which this package expects via the npm package `@salesforce/cli`.
`smoke:deploy` targets the shared `fullcalendar-dev` org alias directly so it does not depend on whatever global default org happens to be configured.

## Flow

1. Run `pnpm install` at the repo root so `@salesforce/cli` is available to this package.
2. `cd premium/packages/lwc-scheduler-example`.
3. Run `pnpm run dep:build` to refresh `../lwc-scheduler/dist`.
4. If needed, run `pnpm run smoke:login` to log into a Salesforce org and save it as the `fullcalendar-dev` alias.
5. Optionally run `pnpm run smoke:orgs` to confirm that `fullcalendar-dev` is available.
6. Run `pnpm run smoke:deploy`.
7. In the deployed org, open **Setup** from the gear menu.
8. Use **Quick Find** to open **Lightning App Builder**, then click **New**.
9. Select **App Page**, enter a label such as **FullCalendar Scheduler Demo**, select the standard **One Region** template, and click **Done**.
10. Under **Custom**, drag **Scheduler Demo** onto the page, choose its **Theme / Palette** and **Locale**, then click **Save** and **Activate**.
11. During activation, create the Lightning tab if prompted and add the page to a Lightning app such as **Sales**.
12. Open that app from the App Launcher, select the **FullCalendar Scheduler Demo** navigation tab, and verify the resource timeline, theme, palette, locale, sample events, and license behavior.

If `../lwc-scheduler/dist/` has been cleaned or is out of date, run `pnpm run dep:build`; the example symlinks will point at the refreshed output automatically.
