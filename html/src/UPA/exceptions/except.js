
export class LexException {
    constructor(pos, msg) {
        this.pos = pos;
        this.msg = msg;
    }
}

export class ParseException {
    constructor(pos, msg) {
        this.pos = pos;
        this.msg = msg;
    }
}
