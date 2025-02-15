module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testEnvironment: 'jsdom',

  // workaround for  "Unexpected token 'exports'" error while parsing Preact
  testEnvironmentOptions: {
    customExportConditions: [] // don't load "browser" field
  }
}
