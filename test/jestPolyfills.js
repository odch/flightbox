global.fetch = globalThis.fetch;
global.Headers = globalThis.Headers;
global.Request = globalThis.Request;
global.Response = globalThis.Response;

// Default to German in tests (jsdom sets navigator.language to 'en')
localStorage.setItem('flightbox_language', 'de');
