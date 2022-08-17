const LZ4 = require('lz4js');

class Converter {
    constructor(size) {
        this._buffer = new ArrayBuffer(size);

        this.u8 = new Uint8Array(this._buffer);
        this.u16 = new Uint16Array(this._buffer);
        this.u32 = new Uint32Array(this._buffer);
        this.u64 = new BigUint64Array(this._buffer);

        this.i8 = new Int8Array(this._buffer);
        this.i16 = new Int16Array(this._buffer);
        this.i32 = new Int32Array(this._buffer);
        this.i64 = new BigInt64Array(this._buffer);

        this.f32 = new Float32Array(this._buffer);
        this.f64 = new Float64Array(this._buffer);
    }
}

class UTF8 {
    constructor() {
        this._encoder = new TextEncoder();
        this._decoder = new TextDecoder();
    }

    /**
     * Encodes an utf8 string into a new buffer
     */
    encode(str = '') {
        return this._encoder.encode(str);
    }

    /**
     * Encodes an utf8 string into an existing buffer
     */
    encodeInto(str = '', buffer = new Uint8Array(str.length), position = 0) {
        if(str.length) return this._encoder.encodeInto(str, position ? buffer.subarray(position | 0) : buffer);
        return { read: 0, written: 0 };
    }

    /**
     * Decodes an utf8 string from an existing buffer
     */
    decode(buffer) {
        return this._decoder.decode(buffer);
    }
}

class BinaryReader {
    constructor(buffer, startPos = 0) {
        buffer instanceof Uint8Array ? this.buffer = buffer : this.buffer = new Uint8Array(buffer);
        this.at = startPos;
        this._utf8 = new UTF8();
        this._convo = new Converter(8); // 8 is default, going lower wouldnt allow for u64, i64 and f64 conversion
    }

    /**
     * Reads an unsigned 8 bit integer (Uint8)
     * Also known as unsigned byte
     */
    u8() {
        return this.buffer[this.at++];
    }

    /**
     * Reads an unsigned 16 bit integer (Uint16)
     * Also known as unsigned short
     */
    u16() {
        this._convo.u8.set(this.buffer.subarray(this.at, this.at += 2));
        return this._convo.u16[0];
    }

    /**
     * Reads an unsigned 32 bit integer (Uint32)
     * Also known as unsigned int
     */
    u32() {
        this._convo.u8.set(this.buffer.subarray(this.at, this.at += 4));
        return this._convo.u32[0];
    }

    /**
     * Reads an unsigned 64 bit integer (Uint64)
     * Also known as unsigned long
     */
    u64() {
        this._convo.u8.set(this.buffer.subarray(this.at, this.at += 8));
        return this._convo.u64[0];
    }

    /**
     * Reads a variable length unsigned integer (VarUint32)
     */
    vu() {
        let out = 0;
        let i = 0;
        while (this.buffer[this.at] & 0x80) {
            out |= (this.buffer[this.at++] & 0x7F) << i;
            i += 7;
        }
        out |= (this.buffer[this.at++] & 0x7F) << i;
        return out;
    }

    /**
     * Reads a signed 8 bit integer (Int8)
     * Also known as byte
     */
    i8() {
        this._convo.u8[0] = this.buffer[this.at++]
        return this._convo.i8[0];
    }

    /**
     * Reads a signed 16 bit integer (Int16)
     * Also known as short
     */
    i16() {
        this._convo.u8.set(this.buffer.subarray(this.at, this.at += 2));
        return this._convo.i16[0];
    }

    /**
     * Reads a signed 32 bit integer (Int32)
     * Also known as int
     */
    i32() {
        this._convo.u8.set(this.buffer.subarray(this.at, this.at += 4));
        return this._convo.i32[0];
    }

    /**
     * Reads a signed 64 bit integer (Int64)
     * Also known as long
     */
    i64() {
        this._convo.u8.set(this.buffer.subarray(this.at, this.at += 8));
        return this._convo.i64[0];
    }

    /**
     * Reads a variable length signed integer (VarInt32)
     */
    vi() {
        const out = this.vu();
        return (0 - (out & 1)) ^ (out >>> 1);
    }

    /**
     * Reads a 32 bit float (Float32)
     * Also known as float
     */
    f32() {
        this._convo.u8.set(this.buffer.subarray(this.at, this.at += 4));
        return this._convo.f32[0];
    }

    /**
     * Reads a 64 bit float (Float64)
     * Also known as double
     */
    f64() {
        this._convo.u8.set(this.buffer.subarray(this.at, this.at += 8));
        return this._convo.f64[0];
    }

    /**
     * Reads a variable length float (VarFloat32)
     */
    vf() {
        const out = this.vi();
        this._convo.i32[0] = ((out & 0xFF) << 24) | ((out & 0xFF00) << 8) | ((out >> 8) & 0xFF00) | ((out >> 24) & 0xFF);
        return this._convo.f32[0];
    }

    /**
     * Reads a null terminated String
     */
    stringNT() {
        const end = this.buffer.indexOf(0, this.at);
        const out = this._utf8.decode(this.buffer.slice(this.at, end));
        this.at = end + 1;
        return out;
    }

    /**
     * Decompresses an LZ4 block
     */
    lz4() {
        const buffer = this.buffer.slice(this.at);
        this.at += buffer.length;

        return LZ4.decompress(buffer);
    }

    /**
     * Jump to a certain position in the buffer
     * Default: 0
     */
    jumpTo(position = 0) {
        this.at = position;
    }

    /**
     * Skips a certain amount of bits in the buffer
     * Default: 1
     */
    skipBits(amount = 1) {
        this.at += amount;
    }

    /**
     * Skips a certain amount of bytes in the buffer
     * Default: 1 ( = 8 bits)
     */
    skipBytes(amount = 1) {
        this.skipBits(amount * 8);
    }

    /**
     * Flushes the remaining buffer 
     * and forces any buffered output bytes to be written out
     */
    flush() {
        const slice = this.buffer.slice(this.at);
        this.at += slice.length;
        return slice;
    }

    /**
     * Checks for end of file
     */
    eof() {
        return this.at === this.buffer.byteLength;
    }

    /**
     * Checks for out-of-bounds access
     */
    oob() {
        return this.at > this.buffer.byteLength || this.at < 0;
    }
}

class BinaryWriter {
    constructor(initialLength = 4096) {
        this.buffer = new Uint8Array(initialLength);
        this.length = 0;
        this._utf8 = new UTF8();
        this._convo = new Converter(8); // 8 is default, going lower wouldnt allow for u64, i64 and f64 conversion
    }

    /**
     * Writes an unsigned 8 bit integer (Uint8)
     * Also known as unsigned byte
     */
    u8(num) {
        this.buffer[this.length++] = num;
        return this;
    }

    /**
     * Writes an unsigned 16 bit integer (Uint16)
     * Also known as unsigned short
     */
    u16(num) {
        this._convo.u16[0] = num;
        this.buffer.set(this._convo.u8.slice(0, 2), this.length);
        this.length += 2;
        return this;
    }

    /**
     * Writes an unsigned 32 bit integer (Uint32)
     * Also known as unsigned int
     */
    u32(num) {
        this._convo.u32[0] = num;
        this.buffer.set(this._convo.u8.slice(0, 4), this.length);
        this.length += 4;
        return this;
    }

    /**
     * Writes an unsigned 64 bit integer (Uint64)
     * Also known as unsigned long
     */
    u64(num) {
        this._convo.u64[0] = num;
        this.buffer.set(this._convo.u8.slice(0, 8), this.length);
        this.length += 8;
        return this;
    }

    /**
     * Writes a variable length unsigned integer (VarUint32)
     */
    vu(num) {
        do {
            let part = num;
            num >>>= 7;
            if (num) part |= 0x80;
            this.buffer[this.length++] = part;
        } while (num);
        return this;
    }

    /**
     * Writes a signed 8 bit integer (Int8)
     * Also known as byte
     */
    i8(num) {
        this._convo.i8[0] = num;
        this.buffer[this.length++] = this._convo.u8[0];
        return this;
    }

    /**
     * Writes a signed 16 bit integer (Int16)
     * Also known as short
     */
    i16(num) {
        this._convo.i16[0] = num;
        this.buffer.set(this._convo.u8.slice(0, 2), this.length);
        this.length += 2;
        return this;
    }

    /**
     * Writes a signed 32 bit integer (Int32)
     * Also known as int
     */    
    i32(num) {
        this._convo.i32[0] = num;
        this.buffer.set(this._convo.u8.slice(0, 4), this.length);
        this.length += 4;
        return this;
    }

    /**
     * Writes a signed 64 bit integer (Int64)
     * Also known as long
     */    
    i64(num) {
        this._convo.i64[0] = num;
        this.buffer.set(this._convo.u8.slice(0, 8), this.length);
        this.length += 8;
        return this;
    }

    /**
     * Writes a variable length signed integer (VarInt32)
     */
    vi(num) {
        const sign = (num & 0x80000000) >>> 31;
        if (sign) num = ~num;
        this.vu((num << 1) | sign);
        return this;
    }

    /**
     * Writes a 32 bit float (Float32)
     * Also known as float
     */
    f32(num) {
        this._convo.f32[0] = num;
        this.buffer.set(this._convo.u8.slice(0, 4), this.length);
        this.length += 4;
        return this;
    }

    /**
     * Writes a 64 bit float (Float64)
     * Also known as double
     */
    f64(num) {
        this._convo.f64[0] = num;
        this.buffer.set(this._convo.u8.slice(0, 8), this.length);
        this.length += 8;
        return this;
    }

    /**
     * Writes a variable length float (VarFloat32)
     */
    vf(num) {
        this._convo.f32[0] = num;
        this.vi(((this._convo.i32[0] & 0xFF) << 24) | ((this._convo.i32[0] & 0xFF00) << 8) | ((this._convo.i32[0] >> 8) & 0xFF00) | ((this._convo.i32[0] >> 24) & 0xFF));
        return this;
    }

    /**
     * Writes a null terminated String
     */
    stringNT(str) {
        const { written } = this._utf8.encodeInto(str, this.buffer, this.length);
        this.length += written;
        this.buffer[this.length++] = 0;
        return this;
    }

    /**
     * Writes an array of bits into VarUint32 encoding
     */
    flags(bitmap) {
        let bits = 0;
        for (let bit of bitmap) bits |= bit;

        return this.vu(bits);
    }

    /**
     * Writes the buffered data
     */
    write(length = this.length) {
        return new Uint8Array(this.buffer.slice(0, length).buffer);
    }

    /**
     * Flushes the remaining buffer 
     * and forces any buffered output bytes to be written out
     */
    flush() {
        const slice = this.buffer.slice(this.length);
        this.length += slice.length;
        return slice;
    }

    /**
     * Checks for end of file
     */
    eof() {
        return this.length === this.buffer.byteLength;
    }

    /**
     * Checks for out-of-bounds access
     */
    oob() {
        return this.length > this.buffer.byteLength || this.length < 0;
    }
}

module.exports = { BinaryReader, BinaryWriter };
