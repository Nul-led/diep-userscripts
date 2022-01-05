// ==UserScript==
// @name         Diep Fov Editor (Memory)
// @version      0.2
// @description  Lets you edit your own fov and change it according to your needs by scrolling the mousewheel; Requires either wasm hook (by abc) or my memory hook
// @author       Nulled
// @match        https://diep.io/
// @icon         https://www.google.com/s2/favicons?domain=diep.io
// @grant        none
// ==/UserScript==

const toggleKey = 'j'; // edit for different toggle key
if(!window.localStorage.fovScriptIsActive) window.localStorage.fovScriptIsActive = true; //toggle
//can be edited by writing "window.localStorage.fovScale = <your number>" in the console; can be a float
//bugs will occur if it gets overwritten with anything other than a number
if(!window.localStorage.fovScale) window.localStorage.fovScale = 0.4;
//mousewheel sensitivity
if(!window.localStorage.fovMouseWheelScaling) window.localStorage.fovMouseWheelScaling = 0.001;
const applyToGroup = (root, offset, mem) => { mem.HEAPF32[mem.HEAP32[mem.HEAP32[root >> 2] >> 2] + offset >> 2] = parseFloat(window.localStorage.fovScale); }

(async () => {
    const root = JSON.parse(localStorage.scriptConfig).constantPointers.rootFieldGroup + 9 * 12, offset = JSON.parse(localStorage.scriptConfig).offsets.FOV;
    if(!window.hasOwnProperty('Hook')) setInterval(() => { applyToGroup(root, offset, window.diepMemory); }); // equal to approximately one gametick
    else window.Hook.addEventListener('clientbound', ({ data }) => { if(data[0] === 0) setTimeout(() => applyToGroup(root, offset, window.Hook.Module)) });
})()

document.addEventListener('wheel', e => {
    if(!JSON.parse(window.localStorage.fovScriptIsActive)) return;
    window.localStorage.fovScale = parseFloat(window.localStorage.fovScale) + e.deltaY * parseFloat(window.localStorage.fovMouseWheelScaling);
    if(parseFloat(window.localStorage.fovScale) < 0) window.localStorage.fovScale = 0.05; //edit to change largest fov possible; warning: negative values cause bugs
    if(parseFloat(window.localStorage.fovScale) > 10) window.localStorage.fovScale = 10; //edit to change lowest fov possible; warning: too large values may cause bugs
})

document.addEventListener('keydown', e => { if(e.key === toggleKey) window.localStorage.fovScriptIsActive = !JSON.parse(window.localStorage.fovScriptIsActive); })
// To get the config, msg me on discord: Nulled#7888
