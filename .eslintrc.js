module.exports = {

  parser: 'babel-eslint',

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
    'max-len': 0,
  },
}
