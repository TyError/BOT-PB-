// Limit application animation callbacks, not Rust automation or input delivery.
// Active profiles keep native timing. Worker/offscreen canvas renderers are not patched.
(() => {
  if (window.top !== window || window.__hexPerformance) return;
  const nativeRequest = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  const callbacks = new Map();
  let nextId = 1, frame = null, timer = null, flushing = false;
  let fps = 0, lastFrame = 0;
  function clearScheduled() {
    if (frame !== null) nativeCancel(frame);
    if (timer !== null) nativeClearTimeout(timer);
    frame = timer = null;
  }
  function schedule() {
    if (flushing || frame !== null || timer !== null || !callbacks.size) return;
    const delay = fps ? 1000 / fps - (performance.now() - lastFrame) : 0;
    if (delay > 1) timer = nativeSetTimeout(() => { timer = null; frame = nativeRequest(flush); }, delay);
    else frame = nativeRequest(flush);
  }
  function flush(timestamp) {
    frame = null; lastFrame = timestamp; flushing = true;
    const batch = [...callbacks.keys()];
    for (const id of batch) {
      const callback = callbacks.get(id);
      if (!callback) continue;
      callbacks.delete(id);
      try { callback.call(window, timestamp); }
      catch (error) { nativeSetTimeout(() => { throw error; }, 0); }
    }
    flushing = false; schedule();
  }
  window.requestAnimationFrame = callback => {
    if (typeof callback !== 'function') throw new TypeError('Animation callback must be a function');
    const id = nextId++; callbacks.set(id, callback); schedule(); return id;
  };
  window.cancelAnimationFrame = id => {
    callbacks.delete(id);
    if (!callbacks.size) clearScheduled();
  };
  window.__hexPerformance = Object.freeze({
    setFps(value) {
      const next = Number.isFinite(value) ? Math.max(0, Math.min(60, value)) : 0;
      if (fps === next) return;
      fps = next; clearScheduled(); lastFrame = 0; schedule();
    }
  });
})();
