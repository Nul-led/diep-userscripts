const { BinaryReader, BinaryWriter } = require('./BinaryView');
const Color = require('./Color');

const netColors = require('./data/colors.json');
const tankNames = require('./data/tanks.json');
const statNames = require('./data/stats.json');

class DataReader extends BinaryReader {
    /**
     * Reads a net color code
     */
    netColor() {
        return netColors[this.vu()];
    }
    
    /**
     * Reads a rgb (red - green - blue) color sequence
     * @returns {Color} Color
     */
    rgbColor() {
        return Color.fromRGB(this.u8(), this.u8(), this.u8());
    }

    /**
     * Reads a bgr (blue - green - red) color sequence
     * @returns {Color} Color
     */
    bgrColor() {
        return Color.fromBGR(this.u8(), this.u8(), this.u8());
    }

    /**
     * Reads a hexadecimal color code
     * Format: "#XXXXXX"
     * @returns {Color} Color
     */
    hexColor() {
        return Color.fromHex(this.stringNT());
    }

    /**
     * Reads bitflags with a certain (optional) name mapping
     * Credits go to "Notepad++" / "diep.io#7444"
     * @param {Array.<String>} mapping
     */
    flags(mapping = []) {
        const raw = this.vu().toString(2).split("").map(x => x === '1' ? true : false).reverse();
        if(raw.length > mapping.length) return raw;
        return mapping.reduce((acc, e, i) => ({...acc, [e]: raw[i] === undefined ? false : raw[i] }), {});
    }

    /**
     * Reads an entityId
     */
    entityId() {
        const hash = this.vu();
        if(hash === 0) return null;
        else return `${hash}#${this.vu()}`;
    }

    /**
     * Reads a tankId
     * @returns {String} TankName
     */
    tankId() {
        return tankNames[this.vi()];
    }

    /**
     * Reads a statId
     * @returns {String} StatName
     */
    statId() {
        return statNames[this.vi()];
    }

    /**
     * Reads a 2d position from 2 variable length integers
     * @returns {{x: number, y: number}} Position
     */
    positionVI() {
        return { x: this.vi(), y: this.vi() };
    }

    /**
     * Reads a 2d position from 2 variable length floats
     * @returns {{x: number, y: number}} Position
     */
    positionVF() {
        return { x: this.vf(), y: this.vf() };
    }

    /**
     * Reads an array of a certain length and datatype
     * @param {Number} length
     * @param {String} dataType 
     * @returns {Array.<?>} Array of values
     */
    array(length, dataType = 'u8') {
        const out = new Array(length);
        for(let i = 0; i < length; ++i)
            out.push(this[dataType]());
        return out;
    }

    /**
     * Reads a jumptable into an array of cetain length
     * The values in the jumptable have to be the given datatype
     * Otherwise it is recommended to make your own custom function
     * @param {Number} length
     * @param {String} dataType 
     * @returns {Array.<?>} Array of values
     */
    jumpTableToArray(length, dataType = 'u8') {
        const out = new Array(length);
        const cb = index => out[index] = this[dataType]();
        this.jumpTable(cb);
        return out;
    }

    /**
     * Reads a jumptable
     * @param {Function} callback
     */
    jumpTable(callback) {
        let index = -1, currentJump = 0;
        while(true) {
            currentJump = this.vu() ^ 1;
            if(!currentJump) return;
            index += currentJump;
            callback(index);
        }
    }
}

class DataWriter extends BinaryWriter {
    /**
     * Writes a net color code
     */
    netColor(colorName) {
        const index = netColors.indexOf(colorName);
        if(index === -1) throw `Invalid color name ${colorName}`;
        this.vi(index);
    }

    /**
     * Writes a rgb (red - green - blue) color sequence
     * @param {Color} color 
     */
    rgbColor(color) {
        this.array(color.toRGBArray(), 'u8');
    }

    /**
     * Writes a bgr (blue - green - red) color sequence
     * @param {Color} color 
     */
    bgrColor(color) {
        this.array(color.toBGRArray(), 'u8');
    }

    /**
     * Writes a hexadecimal color code
     * @param {Color} color 
     */
    hexColor(color) {
        this.stringNT(color.toHex());
    }

    flagsArray(flags) {

    }

    flags(flags, order) {

    }

    /**
     * Writes an entityId
     * Format: 'hash#id'
     */
    entityId(entityId) {
        if(!entityId) return this.vu(0);
        const [hash, id] = entityId.split('#');
        this.vu(Number(hash));
        this.vu(Number(id));
    }

    /**
     * Writes a tankId
     */
    tankId(tankName) {
        const index = tankNames.indexOf(tankName);
        if(index === -1) throw `Invalid tank name ${tankName}`;
        this.vi(index);
    }

    /**
     * Writes a statId
     */
    statId(statName) {
        const index = statNames.indexOf(statName);
        if(index === -1) throw `Invalid stat name ${statName}`;
        this.vi(index);
    }

    /**
     * Writes a 2d position with 2 variable length integers
     */
    positionVI(x, y) {
        this.vi(x);
        this.vi(y);
    }

    /**
     * Writes a 2d position with 2 variable length floats
     */
    positionVF(x, y) {
        this.vf(x);
        this.vf(y);
    }

    /**
     * Reads an array with elements of a certain datatype
     * @param {Array.<?>} elements
     * @param {String} dataType 
     */
    array(elements, dataType) {
        for(let i = 0; i < elements.length; ++i)
            this[dataType](elements[i]);
    }

    arrayToJumpTable() {

    }

    jumpTable() {

    }
}

module.exports = { DataReader, DataWriter };
