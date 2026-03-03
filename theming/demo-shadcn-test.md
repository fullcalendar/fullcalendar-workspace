
First run a local shadcn registry:
- `cd ui-shadcn`
- `pnpm run build && pnpm run serve`
- Accessible at http://localhost:3000/

Then test `demo-shadcn-*`
- Each `components.json` is configured to download from http://localhost:3000/
- Run `pnpm run registry:test`, visit dev URL
- After, run `pnpm run registry:clean`
- New packages were added, so revert changes to root pnpm-lock and redo root pnpm-install
