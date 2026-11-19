(() => {
  let armed = false;
  window.__tabpilotRecord = () => { armed = true; };
  addEventListener('click', event => {
    if (!armed) return;
    armed = false;
    event.preventDefault(); event.stopImmediatePropagation();
    window.ipc.postMessage(JSON.stringify({kind:'record', x:event.clientX, y:event.clientY, viewport_width:innerWidth, viewport_height:innerHeight}));
  }, true);
})();

(() => {
  if (window.top !== window) return;
  let session=null,last=0,lastMove=0,moves=true,baseWidth=1,baseHeight=1;
  const heldKeys=new Map(),heldButtons=new Map();
  const modifiers=e=>(e.altKey?1:0)|(e.ctrlKey?2:0)|(e.metaKey?4:0)|(e.shiftKey?8:0);
  const blocked=e=>e.target?.closest?.('input[type="password"],input[autocomplete="current-password"],input[autocomplete="new-password"],input[autocomplete="one-time-code"]');
  const mouseButton=e=>['left','middle','right'][e.button];
  const point=e=>({x:Math.min(baseWidth-1,Math.max(0,e.clientX*baseWidth/innerWidth)),y:Math.min(baseHeight-1,Math.max(0,e.clientY*baseHeight/innerHeight)),modifiers:modifiers(e)});
  function emit(action){if(!session)return;const now=performance.now();const delay_ms=last?Math.max(0,Math.round(now-last)):0;last=now;window.ipc.postMessage(JSON.stringify({kind:'macro_event',session,step:{delay_ms,action}}));}
  function release(){for(const a of heldKeys.values())emit({...a,type:'key_up',modifiers:0});for(const a of heldButtons.values())emit({...a,type:'mouse_up',modifiers:0});heldKeys.clear();heldButtons.clear();}
  window.__tabpilotMacro={start(token,recordMoves){release();session=token;last=0;lastMove=0;moves=recordMoves;baseWidth=innerWidth;baseHeight=innerHeight;window.ipc.postMessage(JSON.stringify({kind:'macro_begin',session,viewport:{width:baseWidth,height:baseHeight}}));},stop(){release();session=null;}};
  addEventListener('keydown',e=>{if(!session||!e.isTrusted||e.repeat||blocked(e)||!e.code)return;const a={type:'key_down',key:e.key,code:e.code,virtual_key:e.keyCode,modifiers:modifiers(e)};if(heldKeys.has(e.code))return;heldKeys.set(e.code,a);emit(a);},true);
  addEventListener('keyup',e=>{if(!session||!e.isTrusted)return;const a=heldKeys.get(e.code);if(!a)return;heldKeys.delete(e.code);emit({...a,type:'key_up',modifiers:modifiers(e)});},true);
  addEventListener('mousedown',e=>{if(!session||!e.isTrusted||blocked(e)||!mouseButton(e))return;const a={type:'mouse_down',...point(e),button:mouseButton(e)};if(heldButtons.has(e.button))return;heldButtons.set(e.button,a);emit(a);},true);
  addEventListener('mouseup',e=>{if(!session||!e.isTrusted)return;const a=heldButtons.get(e.button);if(!a)return;heldButtons.delete(e.button);emit({...a,...point(e),type:'mouse_up'});},true);
  addEventListener('mousemove',e=>{if(!session||!e.isTrusted||!moves||performance.now()-lastMove<50)return;lastMove=performance.now();emit({type:'mouse_move',...point(e)});},true);
  addEventListener('wheel',e=>{if(!session||!e.isTrusted)return;emit({type:'wheel',...point(e),delta_x:Math.max(-10000,Math.min(10000,e.deltaX)),delta_y:Math.max(-10000,Math.min(10000,e.deltaY))});},true);
  addEventListener('blur',release,true);
})();
