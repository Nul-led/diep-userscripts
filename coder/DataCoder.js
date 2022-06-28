const { BinaryReader, BinaryWriter } = require('./BinaryView');
const Color = require('./Color');

const netColors = require('./colors.json');
const tankNames = require('./tanks.json');
const statNames = require('./stats.json');


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
        for(let i = 0; i < length; i++)
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
    
}

module.exports = { DataReader, DataWriter };
