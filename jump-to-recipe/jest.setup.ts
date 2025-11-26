import '@testing-library/jest-dom';

// Polyfill for Next.js Request/Response in tests
if (typeof Request === 'undefined') {
  global.Request = class Request {} as any;
}

if (typeof Response === 'undefined') {
  global.Response = class Response {} as any;
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {} as any;
}