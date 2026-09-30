// Empty stub for Node-only modules (undici, fs, path) that
// @doist/todoist-sdk lazily imports for file-path uploads and its Node HTTP
// dispatcher. Aliased in vite.config.mjs so the browser bundle never resolves
// the real modules; the stub is only loaded if the SDK's Node code path runs.
export default {};
