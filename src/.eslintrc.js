
module.exports = {

  parser: 'typescript-eslint-parser',

  parserOptions: {
    sourceType: 'module',
  },

  extends: [
    '../.eslintrc.js',
  ],

  rules: {
    'no-unused-vars': 0,
    'no-undef': 0,
  },
}
