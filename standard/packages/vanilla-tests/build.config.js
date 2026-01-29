export default {
  globalConfig: {
  },
  exports: {
    ".": {
      format: "global",
      primary: true,
      generator: "./scripts/generate-index.js"
    }
  }
}
