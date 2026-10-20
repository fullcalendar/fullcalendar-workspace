declare const __FORCE_REACT__: boolean

/*
Whether the suite runs against the React-rendering builds (FORCE_REACT, see vitest.config.base.ts).
Only for behavior that genuinely differs under React.
*/
export const isForceReact: boolean = __FORCE_REACT__
