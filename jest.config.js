module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
  bail: true,
  testRegex: '.*\.spec.js',
  moduleFileExtensions: [
    'ts',
    'js',
    'json',
    'node',
  ],
}
