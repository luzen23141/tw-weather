import '@testing-library/react-native/extend-expect';

// Mock API Keys for unit testing without relying on .env presence
process.env.EXPO_PUBLIC_CWA_API_KEY = 'test-key';
process.env.EXPO_PUBLIC_WEATHERAPI_KEY = 'test-key';
process.env.EXPO_PUBLIC_OPENWEATHERMAP_KEY = 'test-key';
