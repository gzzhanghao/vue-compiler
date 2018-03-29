module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testRegex: '.*\.spec.js',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/PostCSSScope.js',
  ],
}
