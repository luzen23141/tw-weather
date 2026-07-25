import '@testing-library/jest-dom';

// Mock React Native modules
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Text: 'Text',
  View: 'View',
  StyleSheet: {
    flatten: jest.fn((style) => style),
  },
  useColorScheme: jest.fn(() => 'light'),
}));

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Stack: {
    Screen: jest.fn(({ children }) => children),
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 25.0, longitude: 121.5 },
    }),
  ),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const mockComponent = (name: string) =>
    React.forwardRef((props: any, ref: any) => React.createElement(name, { ...props, ref }));
  return {
    __esModule: true,
    default: mockComponent('Svg'),
    Svg: mockComponent('Svg'),
    Circle: mockComponent('Circle'),
    Defs: mockComponent('Defs'),
    G: mockComponent('G'),
    Line: mockComponent('Line'),
    LinearGradient: mockComponent('LinearGradient'),
    Path: mockComponent('Path'),
    Rect: mockComponent('Rect'),
    Stop: mockComponent('Stop'),
    Text: mockComponent('SvgText'),
  };
});

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('react-test-renderer is deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
