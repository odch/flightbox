global.fetch = globalThis.fetch;
global.Headers = globalThis.Headers;
global.Request = globalThis.Request;
global.Response = globalThis.Response;

// react-router-dom v7 imports use TextEncoder/TextDecoder at module-load
// time; jest-jsdom doesn't expose them by default in Node 22.
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

// Default to German in tests (jsdom sets navigator.language to 'en')
localStorage.setItem('flightbox_language', 'de');
