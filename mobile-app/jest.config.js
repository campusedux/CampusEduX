module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // `@expo/vector-icons` -> `expo-font` native module blows up under plain
  // react-test-renderer; swap it for a <Text> stand-in. See the mock file.
  moduleNameMapper: {
    '^@expo/vector-icons$': '<rootDir>/tests/mocks/vector-icons.mock.tsx',
    '^@expo/vector-icons/(.*)$': '<rootDir>/tests/mocks/vector-icons.mock.tsx',
    // Shared chrome (Screen, tab bar, drawer) reads the persisted settings store, which imports AsyncStorage's
    // native module. Use the library's official jest mock everywhere so any test importing `@/components/ui` works.
    '^@react-native-async-storage/async-storage$': '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
  },
};
