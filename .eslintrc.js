module.exports = {
  'env': {
    'es6': true,
    'node': true,
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'sourceType': 'module',
  },
  'rules': {
    'indent': [2, 2, {'SwitchCase': 1}],
    'linebreak-style': ['error', 'windows'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'no-console': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'eqeqeq': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'comma-style': ['error', 'last'],
    'no-multiple-empty-lines': [1, { 'max': 1 }],
    'no-spaced-func': 'error',
    'keyword-spacing': 'error',
    'space-before-blocks': 'error',
  },
}
