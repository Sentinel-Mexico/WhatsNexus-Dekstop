'use strict';

var memory = new WebAssembly.Memory({ initial: 108 });

function readWasmString(offset, length) {
  const bytes = new Uint8Array(memory.buffer, offset, length);
  return new TextDecoder('utf8').decode(bytes);
}

function handleOutput(type) {
  return function(offset, length) {
    const lines = readWasmString(offset, length).split('\n');
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].length === 0) continue;
      console.log(`[DOOM ${type}]`, lines[i]);
    }
  };
}

let getmsCalls = 0;
function getMilliseconds() {
  ++getmsCalls;
  return performance.now();
}

const canvas = document.getElementById('screen');
const doomScreenWidth = 640;
const doomScreenHeight = 400;

function drawCanvas(ptr) {
  const doomScreen = new Uint8ClampedArray(memory.buffer, ptr, doomScreenWidth * doomScreenHeight * 4);
  const renderScreen = new ImageData(doomScreen, doomScreenWidth, doomScreenHeight);
  const ctx = canvas.getContext('2d');
  ctx.putImageData(renderScreen, 0, 0);
}

const importObject = {
  js: {
    js_console_log: handleOutput('log'),
    js_stdout: handleOutput('stdout'),
    js_stderr: handleOutput('stderr'),
    js_milliseconds_since_start: getMilliseconds,
    js_draw_screen: drawCanvas
  },
  env: {
    memory: memory
  }
};

async function startDoom() {
  try {
    let wasmInstance;
    try {
      const response = await fetch('doom.wasm');
      const bytes = await response.arrayBuffer();
      const results = await WebAssembly.instantiate(bytes, importObject);
      wasmInstance = results.instance;
    } catch (e) {
      console.warn('[DOOM] ArrayBuffer instantiation failed, falling back to streaming:', e);
      const streamed = await WebAssembly.instantiateStreaming(fetch('doom.wasm'), importObject);
      wasmInstance = streamed.instance;
    }

    // Initialize Doom engine
    wasmInstance.exports.main();

    // Keycode mapping for Doom engine
    const doomKeyCode = function(keyCode) {
      switch (keyCode) {
        case 8: return 127;             // Backspace
        case 13: return 13;             // Enter
        case 17: return (0x80 + 0x1d);  // Right Ctrl / Ctrl (Fire)
        case 18: return (0x80 + 0x38);  // Alt (Strafe)
        case 27: return 27;             // Escape
        case 32: return 32;             // Space (Open / Use)
        case 37: return 0xac;           // Left arrow
        case 38: return 0xad;           // Up arrow
        case 39: return 0xae;           // Right arrow
        case 40: return 0xaf;           // Down arrow
        case 16: return (0x80 + 0x36);  // Shift (Run)
        default:
          if (keyCode >= 65 && keyCode <= 90) {
            return keyCode + 32;        // ASCII lowercase
          }
          if (keyCode >= 112 && keyCode <= 123) {
            return keyCode + 75;        // F1 - F12
          }
          return keyCode;
      }
    };

    const keyDown = function(code) {
      wasmInstance.exports.add_browser_event(0 /* KeyDown */, code);
    };
    const keyUp = function(code) {
      wasmInstance.exports.add_browser_event(1 /* KeyUp */, code);
    };

    // Keyboard event listeners
    window.addEventListener('keydown', function(event) {
      keyDown(doomKeyCode(event.keyCode));
      if ([32, 37, 38, 39, 40, 9].includes(event.keyCode)) {
        event.preventDefault();
      }
    }, false);

    window.addEventListener('keyup', function(event) {
      keyUp(doomKeyCode(event.keyCode));
      if ([32, 37, 38, 39, 40, 9].includes(event.keyCode)) {
        event.preventDefault();
      }
    }, false);

    // Canvas autofocus
    canvas.focus();
    window.addEventListener('click', () => {
      canvas.focus();
    });

    // Main animation loop
    function step() {
      wasmInstance.exports.doom_loop_step();
      window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);

    console.log('[DOOM] Native WebAssembly Doom running smoothly.');
  } catch (err) {
    console.error('[DOOM] Failed to initialize WebAssembly Doom:', err);
  }
}

document.addEventListener('DOMContentLoaded', startDoom);
