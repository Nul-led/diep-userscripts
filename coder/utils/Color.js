class Color {
    constructor(r, g, b) {
        this.red = r;
        this.green = g;
        this.blue = b;
    }

    /**
     * @param {*} r 0 to 255
     * @param {*} g 0 to 255
     * @param {*} b 0 to 255
     */
    static fromRGB(r, g, b) {
        return new Color(r, g, b);
    }

    /**
     * @param {*} b 0 to 255
     * @param {*} g 0 to 255
     * @param {*} r 0 to 255
     */
    static fromBGR(b, g, r) {
        return new Color(r, g, b);
    }

    /**
     * @param {*} str Format: "#xxxxxx" 
     */
    static fromHex(str) {
        const r = Number(`0x${str.slice(1, 3)}`);
        const g = Number(`0x${str.slice(3, 5)}`);
        const b = Number(`0x${str.slice(5, 7)}`);
        return new Color(r, g, b);
    }

    toRGBArray() {
        return [this.red, this.green, this.blue];
    }

    toBGRArray() {
        return this.toRGBArray().reverse();
    }

    toHex() {
        return `#${((1 << 24) + (this.red << 16) + (this.green << 8) + (this.blue << 0)).toString(16).slice(1)}`;
    }
}

module.exports = Color;
