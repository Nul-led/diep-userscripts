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
    byHeader() {
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

    update() {}

    /**
     * Reads an outdated client packet
     */
    outdated() {
        return {
            header: CLIENTBOUND_HEADERS.outdated,
            kind: CLIENTBOUND_KINDS.outdated,
            data: {},
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
                block: this.flush()
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

class ClientboundWriter extends DataWriter {

}

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
 * 09 Tank Tank
 * 10 PoW Answer
 * 11 Eval Answer
 */

class ServerboundReader extends DataReader {

}

class ServerboundWriter extends DataWriter {

}

module.exports = {
    ClientboundReader,
    ClientboundWriter,
    ServerboundReader,
    ServerboundWriter
}
