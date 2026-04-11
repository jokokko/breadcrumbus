// Normalize to browser.* API for both Chrome (chrome.*) and Firefox (browser.*)
var browser = globalThis.browser ?? globalThis.chrome;
