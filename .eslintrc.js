module.exports = {

  parser: 'typescript-eslint-parser',

  parserOptions: {
    sourceType: 'module',
  },

  env: {
    node: true,
    es6: true,
  },

  extends: [
    'google',
  ],

  rules: {
    'semi': [2, 'never'],
    'object-curly-spacing': [2, 'always'],
    'no-undef': 2,
    'max-len': 0,
    'require-jsdoc': 0,
    'padded-blocks': 0,
    'no-unused-vars': 0,
    'no-undef': 0,
  },
}
