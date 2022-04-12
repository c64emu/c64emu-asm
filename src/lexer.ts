/******************************************************************************
 * C64 Assembler -- for the web                                               *
 * (c) 2022 by Andreas Schwenk, License: GPLv3                                *
 * mailto:contact@compiler-construction.com                                   *
 *****************************************************************************/

export enum TokenType {
    Unknown = 'unknown',
    Id = 'id',
    Hex = 'hex',
    Delimiter = 'delimiter',
    Str = 'str',
    End = 'end',
}

export class Lexer {
    private src = '';
    private srcLen = 0;
    private srcRow = 1;
    private srcCol = 1;
    private srcPos = 0;
    private token = '';
    private tokenType = TokenType.Unknown;
    private tokenCol = 1;
    private tokenRow = 1;
    private errorString = '';

    constructor(src: string) {
        this.errorString = '';

        src = src.trim() + '\n';
        this.src = src;
        this.srcLen = src.length;
        this.srcPos = 0;
        this.srcRow = this.srcCol = 1;
        this.token = '';
    }

    getToken(): string {
        return this.token;
    }

    getSrcRow(): number {
        return this.srcRow;
    }

    getSrcCol(): number {
        return this.srcCol;
    }

    getTokenRow(): number {
        return this.tokenRow;
    }

    getTokenCol(): number {
        return this.tokenCol;
    }

    getErrorString(): string {
        return this.errorString;
    }

    error(msg: string, row = -1, col = -1): void {
        if (row < 0) row = this.tokenRow;
        if (col < 0) col = this.tokenCol;
        const s = '' + row + ':' + col + ':' + msg;
        this.errorString += s + '\n';
        throw Error(s);
    }

    isDEL(s: string): boolean {
        return this.token === s;
    }

    isEnd(): boolean {
        return this.tokenType == TokenType.End;
    }

    isID(): boolean {
        return this.tokenType == TokenType.Id;
    }

    isHEX(): boolean {
        return this.tokenType == TokenType.Hex;
    }

    DEL(terminal: string): void {
        if (this.token === terminal) this.next();
        else {
            terminal = terminal.replace('\n', '\\n').replace('\t', '\\t');
            this.error("expected '" + terminal + "'");
        }
    }

    ID(): string {
        let id = '';
        if (this.tokenType == TokenType.Id) {
            id = this.token;
            this.next();
        } else this.error('expected ID');
        return id;
    }

    HEX(): string {
        let hex = '';
        if (this.tokenType == TokenType.Hex) {
            hex = this.token;
            this.next();
        } else this.error('expected HEX');
        return hex;
    }

    STR(): string {
        let str = '';
        if (this.tokenType == TokenType.Str) {
            str = this.token;
            this.next();
        } else this.error('expected STR');
        return str;
    }

    next(): void {
        let i, k: number;
        // END
        if (this.srcPos >= this.srcLen) {
            this.tokenType = TokenType.End;
            return;
        }
        let skipped: boolean;
        do {
            skipped = false;
            // skip comments
            if (this.srcPos < this.srcLen && this.src[this.srcPos] == ';') {
                skipped = true;
                this.srcCol++;
                this.srcPos++;
                for (k = 0, i = this.srcPos; i < this.srcLen; i++, k++) {
                    if (this.src[i] == '\n') break;
                }
                this.srcCol += k;
                this.srcPos = i;
            }
            // skip whitespace characters (not in first column)
            if (
                this.srcPos < this.srcLen &&
                this.srcCol > 1 &&
                (this.src[this.srcPos] == ' ' || this.src[this.srcPos] == '\t')
            ) {
                skipped = true;
                this.srcCol++;
                this.srcPos++;
            }
        } while (skipped);
        this.token = '';
        this.tokenCol = this.srcCol;
        this.tokenRow = this.srcRow;
        // ID = ALPH { ALPH | NUM0 };
        for (k = 0, i = this.srcPos; i < this.srcLen; i++, k++) {
            if (this.ALPH(i) || (k >= 0 && this.NUM0(i)))
                this.token += this.src[i];
            else break;
        }
        if (k > 0) {
            this.srcCol += k;
            this.srcPos = i;
            this.tokenType = TokenType.Id;
            return;
        }
        // HEX = "$" { NUM0 | ALPH_AF };
        for (k = 0, i = this.srcPos; i < this.srcLen; i++, k++) {
            if (k == 0) {
                if (this.src[i] !== '$') break;
            } else if (this.NUM0(i) || this.ALPH_AF(i))
                this.token += this.src[i];
            else break;
        }
        if (k > 0) {
            this.srcCol += k;
            this.srcPos = i;
            this.tokenType = TokenType.Hex;
            return;
        }
        // STR = "\"" .. "\"";
        for (k = 0, i = this.srcPos; i < this.srcLen; i++, k++) {
            if (k == 0) {
                if (this.src[i] === '"') this.token += this.src[i];
                else break;
            } else if (this.src[i] === '"') {
                this.token += this.src[i];
                k++;
                break;
            } else if (this.src[i] === '\n') {
                break;
            } else {
                this.token += this.src[i];
            }
        }
        if (k >= 2 && this.token.endsWith('"')) {
            this.token = this.token.slice(1, -1);
            this.srcCol += k;
            this.srcPos = i;
            this.tokenType = TokenType.Str;
            return;
        }
        // DELIMITER
        this.token = this.src[i];
        this.tokenType = TokenType.Delimiter;
        this.srcCol++;
        this.srcPos++;
        if (this.token === '\n') {
            this.srcCol = 1;
            this.srcRow++;
        }
    }

    private ALPH(i: number): boolean {
        return (
            (this.src[i] >= 'A' && this.src[i] <= 'Z') ||
            (this.src[i] >= 'a' && this.src[i] <= 'z') ||
            this.src[i] == '_'
        );
    }

    private ALPH_AF(i: number): boolean {
        return (
            (this.src[i] >= 'A' && this.src[i] <= 'F') ||
            (this.src[i] >= 'a' && this.src[i] <= 'f')
        );
    }

    private NUM(i: number): boolean {
        return this.src[i] >= '1' && this.src[i] <= '9';
    }

    private NUM0(i: number): boolean {
        return this.src[i] >= '0' && this.src[i] <= '9';
    }
}
