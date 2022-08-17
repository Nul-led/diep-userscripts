const { DataReader, DataWriter } = require('./DataCoder');

/**
 * Clientbound
 * 00 Update
 * 01 Outdated
 * 02 Compressed
 * 03 Notification
 * 04 Server Info
 * 05 Heartbeat
 * 06 PartyId
 * 07 Accept
 * 08 Achievement
 * 09 Invalid Party
 * 10 Player Count
 * 11 PoW Challenge
 * 12 -
 * 13 Eval Challenge
 */

const CLIENTBOUND_HEADERS = {
    update: 0x00,
    outdated: 0x01,
    compressed: 0x02,
    notification: 0x03,
    serverInfo: 0x04,
    heartbeat: 0x05,
    partyId: 0x06,
    accept: 0x07,
    achievement: 0x08,
    invalidParty: 0x09,
    playerCount: 0x0A,
    powRequest: 0x0B,
    evalRequest: 0x0D
};

const CLIENTBOUND_KINDS = {
    update: 'UPDATE',
    outdated: 'OUTDATED_CLIENT',
    compressed: 'COMPRESSED',
    notification: 'NOTIFICATION',
    serverInfo: 'SERVER_INFO',
    heartbeat: 'HEARTBEAT',
    partyId: 'PARTY_INFO',
    accept: 'ACCEPT',
    achievement: 'ACHIEVEMENT',
    invalidParty: 'INVALID_PARTY',
    playerCount: 'PLAYER_COUNT',
    powRequest: 'POW_CHALLENGE',
    evalRequest: 'EVAL_CHALLENGE',
    unknown: 'UNKNOWN'
};

class ClientboundReader extends DataReader {
    /**
     * Reads the current packet automatically by reading the packet header
     */
    readPacket() {
        const header = this.u8();
        switch(header) {
            case CLIENTBOUND_HEADERS.update: return this.update();
            case CLIENTBOUND_HEADERS.outdated: return this.outdated();
            case CLIENTBOUND_HEADERS.compressed: return this.compressed();
            case CLIENTBOUND_HEADERS.notification: return this.notification();
            case CLIENTBOUND_HEADERS.serverInfo: return this.serverInfo();
            case CLIENTBOUND_HEADERS.heartbeat: return this.heartbeat();
            case CLIENTBOUND_HEADERS.partyId: return this.partyId();
            case CLIENTBOUND_HEADERS.accept: return this.accept();
            case CLIENTBOUND_HEADERS.achievement: return this.achievement();
            case CLIENTBOUND_HEADERS.invalidParty: return this.invalidParty();
            case CLIENTBOUND_HEADERS.playerCount: return this.playerCount();
            case CLIENTBOUND_HEADERS.powRequest: return this.powRequest();
            case CLIENTBOUND_HEADERS.evalRequest: return this.evalRequest();
            default: return this.unknown(header);
        }
    }
    
    /**
     * Wraps the readPacket method with a callback to potentially provide easier access
     */
    readPacketCB(cb) {
        cb(this.readPacket());
    }

    /**
     * Reads an update packet
     * Since the fields are still private this will be held back for now
     * Implement your own 0x00 parser here if you want :)
     */
    update() {
        
    }

    /**
     * Reads an outdated client packet
     */
    outdated() {
        return {
            header: CLIENTBOUND_HEADERS.outdated,
            kind: CLIENTBOUND_KINDS.outdated,
            data: {
                build: this.stringNT(),
            },
            raw: this.buffer
        };
    }

    /**
     * Reads a compressed packet
     */
    compressed() {
        return {
            header: CLIENTBOUND_HEADERS.compressed,
            kind: CLIENTBOUND_KINDS.compressed,
            data: {
                decompressedOutputLength: this.u32(),
                block: this.lz4(), // recursively parse this
            },
            raw: this.buffer
        };
    }

    /**
     * Reads a notification packet
     */
    notification() {
        const message = this.stringNT();
        const color = this.bgrColor();
        // next byte is empty cuz color would originally be u32
        this.u8();
        return {
            header: CLIENTBOUND_HEADERS.notification,
            kind: CLIENTBOUND_KINDS.notification,
            data: {
                message,
                color,
                duration: this.f32(),
                identifier: this.stringNT()
            },
            raw: this.buffer
        };
    }

    /**
     * Reads a server info packet
     */
    serverInfo() {
        return {
            header: CLIENTBOUND_HEADERS.serverInfo,
            kind: CLIENTBOUND_KINDS.serverInfo,
            data: {
                gamemode: this.stringNT(),
                serverUUID: this.stringNT(),
                hostRegion: this.stringNT()
            },
            raw: this.buffer
        };
    }

    /**
     * Reads a heartbeat packet
     */
    heartbeat() {
        return {
            header: CLIENTBOUND_HEADERS.heartbeat,
            kind: CLIENTBOUND_KINDS.heartbeat,
            data: {},
            raw: this.buffer
        };
    }

    /**
     * Reads a party packet
     */
    partyId() {
        let out = '';
        while(!this.eof()) {
            const byte = this.u8().toString(16).toUpperCase().split('');
            if(byte.length === 1) out += byte[0] + '0';
            else out += byte[1] + byte[0];
        }
        return {
            header: CLIENTBOUND_HEADERS.partyId,
            kind: CLIENTBOUND_KINDS.partyId,
            data: {
                partyId: out
            },
            raw: this.buffer
        };
    }

    /**
     * Reads an accept packet
     */
    accept() {
        return {
            header: CLIENTBOUND_HEADERS.accept,
            kind: CLIENTBOUND_KINDS.accept,
            data: {},
            raw: this.buffer
        };
    }

    /**
     * Reads an achievement packet
     */
    achievement() {
        const count = this.vu();
        return {
            header: CLIENTBOUND_HEADERS.achievement,
            kind: CLIENTBOUND_KINDS.achievement,
            data: {
                count,
                hashes: this.array(count, 'stringNT')
            },
            raw: this.buffer
        };
    }

    /**
     * Reads an invalid party packet
     */
    invalidParty() {
        return {
            header: CLIENTBOUND_HEADERS.invalidParty,
            kind: CLIENTBOUND_KINDS.invalidParty,
            data: {},
            raw: this.buffer
        };
    }

    /**
     * Reads a player count packet
     */
    playerCount() {
        return {
            header: CLIENTBOUND_HEADERS.playerCount,
            kind: CLIENTBOUND_KINDS.playerCount,
            data: {
                count: this.vu()
            },
            raw: this.buffer
        };
    }
    
    /**
     * Reads a PoW challenge packet
     */
    powRequest() {
        return {
            header: CLIENTBOUND_HEADERS.powRequest,
            kind: CLIENTBOUND_KINDS.powRequest,
            data: {
                difficulty: this.vu(),
                prefix: this.stringNT()
            },
            raw: this.buffer
        };
    }

    /**
     * Reads an eval challenge packet
     */
    evalRequest() {
        return {
            header: CLIENTBOUND_HEADERS.evalRequest,
            kind: CLIENTBOUND_KINDS.evalRequest,
            data: {
                id: this.vu(),
                code: this.stringNT()
            },
            raw: this.buffer
        };
    }

    /**
     * Reads an unknown packet
     * This is unusual and shouldn't happen
     */
    unknown(header) {
        return {
            header,
            kind: CLIENTBOUND_KINDS.unknown,
            data: {},
            raw: this.buffer
        };
    }
}

class ClientboundWriter extends DataWriter {} // Unneeded

/**
 * Serverbound
 * 00 Init
 * 01 Input
 * 02 Spawn
 * 03 Stat
 * 04 Tank
 * 05 Heartbeat
 * 06 -
 * 07 Extension Found
 * 08 Respawn
 * 09 Take Tank
 * 10 PoW Answer
 * 11 Eval Answer
 */

 const SERVERBOUND_HEADERS = {
    init: 0x00,
    input: 0x01,
    spawn: 0x02,
    upgradeStat: 0x03,
    upgradeTank: 0x04,
    heartbeat: 0x05,
    extensionFound: 0x07,
    respawn: 0x08,
    takeTank: 0x09,
    powReply: 0x0A,
    evalReply: 0x0B,
};

const SERVERBOUND_KINDS = {
    init: 'INIT',
    input: 'INPUT',
    spawn: 'SPAWN',
    upgradeStat: 'UPGRADE_STAT',
    upgradeTank: 'UPGRADE_TANK',
    heartbeat: 'HEARTBEAT',
    extensionFound: 'EXTENSION_FOUND',
    respawn: 'RESPAWN',
    takeTank: 'TAKE_TANK',
    powReply: 'POW_REPLY',
    evalReply: 'EVAL_REPLY',
};

class ServerboundWriter extends DataWriter {
    writePacket(type, ...args) {
        switch (type) {
            case SERVERBOUND_KINDS.init: return this.init(...args);
            case SERVERBOUND_KINDS.input: return this.input(...args);
            case SERVERBOUND_KINDS.spawn: return this.spawn(...args);
            case SERVERBOUND_KINDS.upgradeStat: return this.upgradeStat(...args);
            case SERVERBOUND_KINDS.upgradeTank: return this.upgradeTank(...args);
            case SERVERBOUND_KINDS.heartbeat: return this.heartbeat(...args);
            case SERVERBOUND_KINDS.extensionFound: return this.extensionFound(...args);
            case SERVERBOUND_KINDS.respawn: return this.respawn(...args);
            case SERVERBOUND_KINDS.takeTank: return this.takeTank(...args);
            case SERVERBOUND_KINDS.powReply: return this.powReply(...args);
            case SERVERBOUND_KINDS.evalReply: return this.evalReply(...args);
            default: throw new Error(`Could not create packet ${type}: Unknown Type.`);
        }
    }

    init(build, password, party, token, debug) {
        return this.vu(SERVERBOUND_KINDS.init).stringNT(build).stringNT(password).stringNT(party).stringNT(token).vu(debug).write();
    }

    input(flags, mouseX, mouseY, gamepadX, gamepadY) {
        return this.vu(SERVERBOUND_KINDS.input).flags(flags).vf(mouseX).vf(mouseY).vf(gamepadX).vf(gamepadY).write();
    }

    spawn(name) {
        return this.vu(SERVERBOUND_KINDS.spawn).stringNT(name).write();
    }

    upgradeStat(id, max) {
        return this.vu(SERVERBOUND_KINDS.upgradeStat).statId(id).vi(max).write();
    }

    upgradeTank(id) {
        return this.vu(SERVERBOUND_KINDS.upgradeTank).tankId(tank).write();
    }

    heartbeat() { 
        return this.vu(SERVERBOUND_KINDS.heartbeat).write();
    }

    extensionFound() { // As of now, this packet is unused.
        return this.vu(SERVERBOUND_KINDS.extensionFound).write();
    }

    respawn() {
        return this.vu(SERVERBOUND_KINDS.respawn).write();
    }

    takeTank() {
        return this.vu(SERVERBOUND_KINDS.takeTank).write();
    }

    powReply(result) {
        return this.vu(SERVERBOUND_KINDS.powReply).stringNT(result).write();
    }

    evalReply(id, result) {
        return this.vu(SERVERBOUND_KINDS.evalReply).vu(id).vu(result).write();
    }
}

class ServerboundReader extends DataReader {} // Unneeded

module.exports = {
    ClientboundReader,
    ClientboundWriter,
    ServerboundReader,
    ServerboundWriter
}
