module.exports = {

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
  },
}
