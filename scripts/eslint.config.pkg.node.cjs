
module.exports = {
  extends: ['./eslint.config.base.cjs'],
  env: {
    es6: true, // TODO: keep in sync with other configs?
    node: true,
  },
  ignorePatterns: [
    'dist',
  ],
}
