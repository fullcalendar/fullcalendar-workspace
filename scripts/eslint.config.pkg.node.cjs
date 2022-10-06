
module.exports = {
  extends: ['./eslint.config.base.cjs'],
  env: {
    es6: true, // TODO: keep in sync with other configs?
    node: true,
  },
  ignorePatterns: [
    'dist',
  ],
  overrides: [
    {
      // HACK: simply for adding .cjs extension
      // https://eslint.org/docs/latest/user-guide/command-line-interface#--ext
      files: '**/*.cjs',
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
