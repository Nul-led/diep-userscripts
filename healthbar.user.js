// ==UserScript==
// @name         No invisible healthbars
// @version      0.2
// @description  Enables healthbars for all entities; Requires either wasm hook (by abc) or my memory hook
// @author       Nulled
// @match        https://diep.io/
// @icon         https://www.google.com/s2/favicons?domain=diep.io
// @grant        none
// ==/UserScript==
const applyToAllGroups = (root, offset, value, mem) => { for(let at = mem.HEAP32[root >> 2]; at < mem.HEAP32[root + 4 >> 2]; at = at + 4) mem.HEAP32[mem.HEAP32[at >> 2] + offset >> 2] = value; };
(async () => {
    const wait = cb => {
        if(!window.hasOwnProperty('Hook') && !window.hasOwnProperty('diepMemory')) return setTimeout(wait, 10, cb);
        if(!localStorage.scriptConfig || (/(?!build_)[0-9a-f]{40}(?=\.wasm\.js)/.exec(document.body.innerHTML) || [false])[0] !== JSON.parse(window.localStorage.scriptConfig).build) return setTimeout(wait, 10, cb);
        cb();
    }
    await new Promise(wait);
    const root = JSON.parse(localStorage.scriptConfig).constantPointers.rootFieldGroup + 4 * 12, offset = JSON.parse(localStorage.scriptConfig).offsets.healthbar;
    if(!window.hasOwnProperty('Hook')) setInterval(() => applyToAllGroups(root, offset, 0, window.diepMemory), 50); // equal to approximately one gametick
    else window.Hook.addEventListener('clientbound', ({ data }) => { if(data[0] === 0) applyToAllGroups(root, offset, 0, window.Hook.Module); });
})()
// To get the config, msg me on discord: Nulled#7888; if u want a toggle for the script, go implement it urself lol
