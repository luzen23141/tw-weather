require('@testing-library/react-native/extend-expect');

// Mock proxy URL for adapters that require proxy-only mode
process.env.EXPO_PUBLIC_PROXY_URL = 'https://proxy.test';
