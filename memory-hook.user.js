// ==UserScript==
// @name        Diep Memory Hook
// @author      Nulled
// @description Hooks into the games memory and allows accessing it
// @match       https://diep.io/*
// @version     0.1
// @run-at      document-load
// @grant       none
// ==/UserScript==

const proxy = window.WebAssembly.Memory
// function for execution context
window.WebAssembly.Memory = function(arg) {
    const memory = new proxy(arg);
    window.diepMemory = {
        buffer: memory.buffer,
        HEAP8: new Int8Array(memory.buffer),
        HEAP16: new Int16Array(memory.buffer),
        HEAP32: new Int32Array(memory.buffer),
        HEAPF32: new Float32Array(memory.buffer),
        HEAPF64: new Float64Array(memory.buffer),
        HEAPU8: new Uint8Array(memory.buffer),
        HEAPU16: new Uint16Array(memory.buffer),
        HEAPU32: new Uint32Array(memory.buffer)
    }
    return memory;
}
