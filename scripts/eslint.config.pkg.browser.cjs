// TODO: have a separate non-pkg version for browser+jsx ?

module.exports = {
  extends: [
    './eslint.config.base.cjs',
    'plugin:react/recommended',
  ],
  settings: {
    react: {
      version: '18.2.0', // can't detect b/c we don't use React. hardcode a recent version
    },
  },
  env: {
    es6: true, // TODO: keep in sync with other configs?
    browser: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off', // not compat w/ Preact. checked in ts anyway
    'react/display-name': 'off',
  },
  ignorePatterns: [
    'dist',
  ],
  overrides: [
    {
      files: [
        '*.{js,cjs}', // config files in root
        'scripts/**/*.{js,cjs}', // node scripts
      ],
      env: {
        browser: false,
        node: true,
      },
    },
  ],
}
