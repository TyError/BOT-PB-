// Installed before game scripts, including in child frames.
// Release pointer lock directly; never synthesize Escape or move the OS cursor.
(() => {
  if (window.__hexCursor) return;
  let forced = false, style = null, shortcutDown = false;
  function showCursor() {
    forced = true;
    if (!style) {
      style = document.createElement('style');
      style.textContent = ':root, :root * { cursor: default !important; }';
    }
    if (!style.isConnected && document.documentElement) document.documentElement.append(style);
  }
  function release() {
    showCursor();
    if (document.pointerLockElement) document.exitPointerLock();
    for (let i = 0; i < window.frames.length; i++) {
      window.frames[i].postMessage({hexbotCursor: 'release'}, '*');
    }
  }
  addEventListener('DOMContentLoaded', () => { if (forced) showCursor(); }, {once:true});
  addEventListener('pointerlockchange', () => {
    // A later deliberate game interaction can capture the pointer normally again.
    if (document.pointerLockElement) { forced = false; style?.remove(); }
  }, true);
  addEventListener('message', event => {
    if (window.parent !== window && event.source === window.parent && event.data?.hexbotCursor === 'release') release();
  });
  addEventListener('keydown', event => {
    if (!event.isTrusted || !event.ctrlKey || event.altKey || event.shiftKey || event.metaKey || !['Digit1','Numpad1'].includes(event.code)) return;
    event.preventDefault(); event.stopImmediatePropagation(); shortcutDown = true;
    if (!event.repeat) release();
  }, true);
  addEventListener('keyup', event => {
    if (!event.isTrusted || !shortcutDown || !['Digit1','Numpad1'].includes(event.code)) return;
    event.preventDefault(); event.stopImmediatePropagation(); shortcutDown = false;
  }, true);
  addEventListener('blur', () => { shortcutDown = false; });
  window.__hexCursor = Object.freeze({release});
})();
