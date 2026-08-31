module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // `@expo/vector-icons` -> `expo-font` native module blows up under plain
  // react-test-renderer; swap it for a <Text> stand-in. See the mock file.
  moduleNameMapper: {
    '^@expo/vector-icons$': '<rootDir>/tests/mocks/vector-icons.mock.tsx',
    '^@expo/vector-icons/(.*)$': '<rootDir>/tests/mocks/vector-icons.mock.tsx',
  },
};
