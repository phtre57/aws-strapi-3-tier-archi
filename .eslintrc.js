module.exports = {
  root: false,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser', // Specifies the ESLint
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    ['import/order']: 'error',
    ['import/newline-after-import']: 'error',
    ['import/no-unused-modules']: 'error',
    semi: ['error', 'never'],
    curly: ['error', 'all'],
    quotes: ['error', 'single', { avoidEscape: true }],
    ['@typescript-eslint/naming-convention']: [
      'error',
      {
        selector: 'default',
        format: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],
    ['@typescript-eslint/ban-types']: [
      'error',
      {
        types: {
          object: false,
        },
      },
    ],
    ['import/no-unresolved']: 'off',
    ['@typescript-eslint/ban-ts-ignore']: 'off',
    ['@typescript-eslint/no-explicit-any']: 'off',
    ['prefer-const']: 'error',
    ['no-unused-vars']: ['warn', { args: 'after-used' }],
    ['@typescript-eslint/no-unused-vars']: 'off',
    ['@typescript-eslint/no-use-before-define']: 'off',
    ['@typescript-eslint/no-require-imports']: 'off',
    ['@typescript-eslint/no-var-requires']: 'off',
    ['require-await']: 'warn',
    ['@typescript-eslint/no-non-null-assertion']: 'off',
    ['prettier/prettier']: 'off',
  },
  settings: {
    ['import/parsers']: {
      ['@typescript-eslint/parser']: ['.ts'],
    },
    ['import/resolver']: {
      node: {
        paths: ['src'],
        extensions: ['.ts'],
      },
    },
  },
}
