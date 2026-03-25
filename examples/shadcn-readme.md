
## Testing Shadcn Registry

1. Clear prior state with the `./shadcn-clear.sh` script
2. Go to the `<monorepo-root>/theming/ui-shadcn` directory
3. Run `pnpm run build`
4. Run `pnpm run serve`
5. In `<monorepo-root>/examples/shadcn-event-calendar`
   1. Run `pnpm dlx shadcn@latest add "@fullcalendar/breezy-event-calendar"`
   2. Run `pnpm run dev` and see
   3. In `package.json`, revert the new `workspace:^` semvers
   4. In `components.json`, revert changes to `registries`
6. In `<monorepo-root>/examples/shadcn-scheduler`
   1. Run `pnpm dlx shadcn@latest add "@fullcalendar/breezy-scheduler"`
   2. Run `pnpm run dev` and see
   3. In `package.json`, revert the new `workspace:^` semvers
   4. In `components.json`, revert changes to `registries`
