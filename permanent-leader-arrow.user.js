// ==UserScript==
// @name         Permanent Leader Arrow
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Leader arrow stays active until the leader is in your field of view.
// @author       Altanis#8593
// @match        *://diep.io/*
// @icon         https://www.google.com/s2/favicons?domain=diep.io
// @grant        none
// @run-at       document-body
// ==/UserScript==

(function() {
    'use strict';

    const crx = CanvasRenderingContext2D.prototype;

    // -- PERMANENT LEADER ARROW -- //
    crx.moveTo = new Proxy(crx.moveTo, {
        apply(f, _this, args) {
            if (_this.fillStyle === '#000000' && _this.globalAlpha === 0) {
                _this.fillStyle = 'red';
                _this.globalAlpha = 0.5;
            }

            return f.apply(_this, args);
        }
    });
})();