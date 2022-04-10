/******************************************************************************
 * C64 Emulator -- for the web                                                *
 * (c) 2022 by Andreas Schwenk, License: GPLv3                                *
 * mailto:contact@compiler-construction.com                                   *
 *****************************************************************************/

const petscii_32ff =
    ' !"#$%&´()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[£]';

/* Addressing Modes:
    Implied (**)
    Immediate (IM)
    ZeroPage (ZP), ZeroPageX (ZX), ZeroPageY (ZY)
    Absolute (AB), AbsoluteX (AX), AbsoluteY (AY)
    Indirect (IN), IndirectX (IX), IndirectY (IY)
    JumpRelative (JR), JumpAbsolute (JA)
    Accumulator (AC)
*/
const mos6502InstructionsData = `
------------------------------------------------------------------------------
---  ** IM ZP ZX ZY AB AX AY IN IX IY JR JA AC  Description
------------------------------------------------------------------------------
ADC     69 65 75    6D 7D 79    61 71           Add Memory to Accu with Carry
AND     29 25 35    2D 3D 39    21 31           AND Memory with Accu
ASL        06 16    0E 1E                   0A  Shift Left One Bit
BCC                                   90        Branch on Carry Clear
BCS                                   B0        Branch on Carry Set
BEQ                                   F0        Branch on Result Zero
BIT        24       2C                          Test Bits in Memory with Accu
BMI                                   30        Branch on Result Minus
BNE                                   D0        Branch on Result not Zero
BPL                                   10        Branch on Result Plug
BRK  00                                         Force Break
BVC                                   50        Branch on Overflow Clear
BVS                                   70        Branch on Overflow Set
CLC  18                                         Clear Carry Flag
CLD  D8                                         Clear Decimal Flag
CLI  58                                         Clear Interrupt Disable Bit
------------------------------------------------------------------------------
---  ** IM ZP ZX ZY AB AX AY IN IX IY JR JA AC  Description
------------------------------------------------------------------------------
CLV  B8                                         Clear Overflow Flag
CMP     C9 C5 D5    CD DD D9    C1 D1           Compare Memory with Accu.
CPX     E0 E4       EC                          Compare Memory and Index X
CPY     C0 C4       CC                          Compare Memory and Index Y
DEC        C6 D6    CE DE                       Decrement Memory by One
DEX  CA                                         Decrement Index X by One
DEY  88                                         Decrement Index Y by One
EOR     49 45 55    4D 5D 59    41 51           Exclusive-OR Memory with Accu.
INC        E6 F6    EE FE                       Increment Memory by One
INX  E8                                         Increment Index X by One
INY  C8                                         Increment Index Y by One
JMP                          6C          4C     Jump to New Location
JSR                                      20     Jump to New Location, Save Ret
LDA     A9 A5 B5    AD BD B9    A1 B1           Load Accu with Memory
LDX     A2 A6    B6 AE    BE                    Load Index X
LDY     A0 A4 B4    AC BC                       Load Index Y
------------------------------------------------------------------------------
---  ** IM ZP ZX ZY AB AX AY IN IX IY JR JA AC  Description
------------------------------------------------------------------------------
LSR        46 56    4E 5E                   4A  Shift One Bit Right
NOP  EA                                         No Operation
ORA     09 05 15    0D 1D 19    01 11           OR Memory with Accu
PHA  48                                         Push Accu on Stack
PHP  08                                         Push Processor Status on Stack
PLA  68                                         Pull Accu from Stack
PLP  28                                         Pull Processor Stat. from Stack
ROL        26 36    2E 3E                   2A  Rotate One Bit Left
ROR        66 76    63 7E                   6A  Rotate One Bit Right
RTI  40                                         Return From Interrupt
RTS  60                                         Return From Subroutine
SBC     E9 E5 F5    ED FD F9    E1 F1           Subtract Memory from Accu
SEC  38                                         Set Carry Flag
SED  F8                                         Set Decimal Flag
SEI  78                                         Set Interrupt Disable Status
STA        85 95    8D 9D 99    81 91           Store Accu in Memory
------------------------------------------------------------------------------
---  ** IM ZP ZX ZY AB AX AY IN IX IY JR JA AC  Description
------------------------------------------------------------------------------
STX        86    96 8E                          Store Index X in Memory
STY        84 94    8C                          Store Index Y in Memory
TAX  AA                                         Transfer Accu to Index X
TAY  A8                                         Transfer Accu to Index Y
TSX  BA                                         Transfer Stack Ptr. to Index X
TXA  8A                                         Transfer Index S to Accu
TXS  9A                                         Transfer Index X to Stack Reg.
TYA  98                                         Transfer Index Y to Accu
`;

class MOS6502Instruction {
    mnemonic = '';
    description = '';
    opcImplied = -1;
    opcImmediate = -1;
    opcZeropage = -1;
    opcZeropageX = -1;
    opcZeropageY = -1;
    opcAbsolute = -1;
    opcAbsoluteX = -1;
    opcAbsoluteY = -1;
    opcIndirect = -1;
    opcIndirectX = -1;
    opcIndirectY = -1;
    opcJumpRelative = -1;
    opcJumpAbsolute = -1;
    opcAccumulator = -1;
}

const mos6502Instructions: { [mne: string]: MOS6502Instruction } = {};

function createInstructions(): void {
    let opc = 0;
    const lines = mos6502InstructionsData.split('\n');
    for (const line of lines) {
        if (line.startsWith(' ') || line.startsWith('-') || line.length == 0)
            continue;
        const instr = new MOS6502Instruction();
        instr.mnemonic = line.substring(0, 3);
        instr.description = line.substring(48);
        opc = parseInt(line.substring(5, 7), 16);
        instr.opcImplied = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(8, 10), 16);
        instr.opcImmediate = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(11, 13), 16);
        instr.opcZeropage = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(14, 16), 16);
        instr.opcZeropageX = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(17, 19), 16);
        instr.opcZeropageY = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(20, 22), 16);
        instr.opcAbsolute = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(23, 25), 16);
        instr.opcAbsoluteX = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(26, 28), 16);
        instr.opcAbsoluteY = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(29, 31), 16);
        instr.opcIndirect = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(32, 34), 16);
        instr.opcIndirectX = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(35, 37), 16);
        instr.opcIndirectY = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(38, 40), 16);
        instr.opcJumpRelative = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(41, 43), 16);
        instr.opcJumpAbsolute = isNaN(opc) ? -1 : opc;
        opc = parseInt(line.substring(44, 46), 16);
        instr.opcAccumulator = isNaN(opc) ? -1 : opc;
        mos6502Instructions[instr.mnemonic] = instr;
        //console.log(instr);
    }
}
createInstructions();

class ASM_Label {
    label = '';
    codePosition = 0; // byte index in ASM_Code
    constructor(label = '', codePosition = 0) {
        this.label = label;
        this.codePosition = codePosition;
    }
}

class ASM_UnresolvedAddress {
    label = '';
    codePosition = 0; // byte index in ASM_Code
    srcRow = 1;
    relative = false;
    branch = false;
    constructor(
        label = '',
        codePosition = 0,
        srcRow = 1,
        relative = false,
        branch = false,
    ) {
        this.label = label;
        this.codePosition = codePosition;
        this.srcRow = srcRow;
        this.relative = relative;
        this.branch = branch;
    }
}

export interface ASM_Code_Format {
    includeAddress: boolean;
    matchSourceCode: boolean;
    includeSourceCode: boolean; // only considered, if matchSourceCode == true
    maxBytesPerRow: number; // only considered, if matchSourceCode == false
}

export class ASM_Code {
    srcLines: string[] = [];
    startAddress = 0;
    bytes: number[] = [];
    srcRows: number[] = [];
    toString(format: ASM_Code_Format): string {
        let s = '';
        if (format.matchSourceCode) {
            let row = 1;
            let col = 1;
            const n = this.bytes.length;
            for (let i = 0; i < n + 1; i++) {
                const byte = i < n ? this.bytes[i] : 0;
                const byteRow =
                    i < n ? this.srcRows[i] : this.srcRows[i - 1] + 1;
                let incrementedRow = false;
                while (row < byteRow) {
                    if (format.includeSourceCode) {
                        while (col < 20) {
                            s += ' ';
                            col++;
                        }
                        s += this.srcLines[row - 1];
                    }
                    s += '\n';
                    col = 1;
                    row++;
                    incrementedRow = true;
                }
                if (i == n) break;
                if (incrementedRow && format.includeAddress) {
                    s +=
                        (this.startAddress + i)
                            .toString(16)
                            .padStart(4, '0')
                            .toUpperCase() + ': ';
                    col += 6;
                }
                if (!format.includeSourceCode || col < 16) {
                    s += byte.toString(16).padStart(2, '0').toUpperCase() + ' ';
                    col += 3;
                } else if (col < 18) {
                    s += '.. ';
                    col += 3;
                }
            }
        } else {
            for (let i = 0; i < this.bytes.length; i++) {
                if (i % format.maxBytesPerRow == 0) {
                    s += '\n$';
                    if (format.includeAddress) {
                        s +=
                            (this.startAddress + i)
                                .toString(16)
                                .padStart(4, '0')
                                .toUpperCase() + ': ';
                    }
                }
                s +=
                    this.bytes[i].toString(16).padStart(2, '0').toUpperCase() +
                    ' ';
            }
            s = s.trim();
        }
        return s;
    }
}

export class ASM_MOS6502 {
    private labels: { [id: string]: ASM_Label } = {};
    private unresolvedAddresses: ASM_UnresolvedAddress[] = [];

    private machineCode: ASM_Code = null;
    private errorString = '';

    private src = '';
    private srcLen = 0;
    private srcRow = 1;
    private srcCol = 1;
    private srcPos = 0;
    private token = '';
    private tokenType = TokenType.Unknown;
    private tokenCol = 1;
    private tokenRow = 1;

    assemble(src: string): boolean {
        src = src.trim() + '\n';
        this.src = src;
        this.srcLen = src.length;
        this.srcPos = 0;
        this.srcRow = this.srcCol = 1;
        this.token = '';
        this.errorString = '';
        this.machineCode = new ASM_Code();
        this.machineCode.srcLines = src.split('\n');
        this.labels = {};
        this.unresolvedAddresses = [];
        // parse and generate machine code
        try {
            this.next();
            while (!this.isEnd()) {
                // TODO: catch parse errors!
                while (!this.isEnd() && this.isDEL('\n')) this.next();
                if (!this.isEnd()) this.parseLine();
            }
        } catch (error) {
            return false;
        }
        // fix unresolved addresses
        for (const ua of this.unresolvedAddresses) {
            const label = this.labels[ua.label];
            if (label === undefined) {
                this.errorString +=
                    '' + ua.srcRow + ":unresolved label '" + ua.label + "'";
                return false;
            }
            if (ua.relative) {
                // TODO: check, if relative address is in bounds (1 byte)
                const offset =
                    (label.codePosition - ua.codePosition - 1) & 0xff;
                this.machineCode.bytes[ua.codePosition] = offset;
            } else {
                let addr = this.machineCode.startAddress + label.codePosition;
                if (ua.branch) addr--;
                this.machineCode.bytes[ua.codePosition] = addr & 0xff;
                this.machineCode.bytes[ua.codePosition + 1] = addr >> 8;
            }
        }
        return true;
    }

    // line = "*" "=" HEX "\n"
    //   | ID "\n"
    //   | " " ID operand "\n"
    //   | " " "." "text" STR "\n";
    private parseLine(): void {
        if (this.isDEL('*')) {
            this.next();
            this.DEL('=');
            const addrStr = this.HEX();
            if (addrStr.length != 4)
                this.error('start address must be 2 bytes long');
            this.machineCode.startAddress = parseInt(addrStr, 16);
            this.DEL('\n');
        } else if (this.isID()) {
            const id = this.token;
            this.next();
            const addr = this.machineCode.bytes.length;
            // TODO: handle duplicate labels correctly!
            this.labels[id] = new ASM_Label(id, addr);
            this.DEL('\n');
        } else if (this.isDEL(' ')) {
            this.next();
            if (this.isID()) {
                const mnemonic = this.ID().toUpperCase();
                if (mnemonic in mos6502Instructions == false)
                    this.error("unknown instruction '" + mnemonic + "'");
                const instruction = mos6502Instructions[mnemonic];
                this.parseOperand(instruction);
            } else {
                this.DEL('.');
                this.DEL('text');
                const str = this.STR();
                for (const ch of str) {
                    if (petscii_32ff.includes(ch)) {
                        const b = petscii_32ff.indexOf(ch) + 32;
                        this.writeMachineCodeByte(b);
                    } else this.error("unknown character'" + ch + '');
                }
            }
            this.DEL('\n');
        } else {
            this.error('expected label or instruction');
        }
    }

    // Operand = "#" HEX
    //   | ID [ "," ("x"|"y") ]
    //   | HEX [ "," ("x"|"y") ]
    //   | "*"
    //   | epsilon;
    private parseOperand(instruction: MOS6502Instruction): void {
        let implied = false;
        let immediate = false;
        let hexStr = '';
        let id = '';
        let asterisk = false;
        let x = false;
        let y = false;
        if (this.isDEL('#')) {
            this.next();
            immediate = true;
            hexStr = this.HEX();
        } else if (this.isID() || this.isHEX()) {
            if (this.isID()) id = this.ID();
            else hexStr = this.HEX();
            if (this.isDEL(',')) {
                this.next();
                if (this.isDEL('x')) {
                    this.next();
                    x = true;
                } else if (this.isDEL('y')) {
                    this.next();
                    y = true;
                } else this.error("expected 'x' or 'y'");
            }
        } else if (this.isDEL('*')) {
            this.next();
            asterisk = true;
        } else if (this.isDEL('\n')) {
            // next must not be called here!
            implied = true;
        }
        const hexValue = parseInt(hexStr, 16);
        if (implied && instruction.opcImplied >= 0) {
            this.writeMachineCodeByte(instruction.opcImplied);
        } else if (
            immediate &&
            hexStr.length == 2 &&
            instruction.opcImmediate >= 0
        ) {
            this.writeMachineCodeByte(instruction.opcImmediate);
            this.writeMachineCodeByte(hexValue);
        } else if (hexStr.length == 2 && x && instruction.opcZeropageX >= 0) {
            this.writeMachineCodeByte(instruction.opcZeropageX);
            this.writeMachineCodeByte(hexValue);
        } else if (hexStr.length == 2 && y && instruction.opcZeropageY >= 0) {
            this.writeMachineCodeByte(instruction.opcZeropageY);
            this.writeMachineCodeByte(hexValue);
        } else if (hexStr.length == 2 && instruction.opcZeropage >= 0) {
            this.writeMachineCodeByte(instruction.opcZeropage);
            this.writeMachineCodeByte(hexValue);
        } else if (hexStr.length == 4 && x && instruction.opcAbsoluteX >= 0) {
            this.writeMachineCodeByte(instruction.opcAbsoluteX);
            this.writeMachineCodeByte(hexValue & 0xff);
            this.writeMachineCodeByte(hexValue >> 8);
        } else if (hexStr.length == 4 && y && instruction.opcAbsoluteY >= 0) {
            this.writeMachineCodeByte(instruction.opcAbsoluteY);
            this.writeMachineCodeByte(hexValue & 0xff);
            this.writeMachineCodeByte(hexValue >> 8);
        } else if (hexStr.length == 4 && instruction.opcAbsolute >= 0) {
            this.writeMachineCodeByte(instruction.opcAbsolute);
            this.writeMachineCodeByte(hexValue & 0xff);
            this.writeMachineCodeByte(hexValue >> 8);
        } else if (id.length > 0 && x && instruction.opcAbsoluteX >= 0) {
            this.writeMachineCodeByte(instruction.opcAbsoluteX);
            const addr = this.machineCode.bytes.length;
            this.unresolvedAddresses.push(
                new ASM_UnresolvedAddress(id, addr, this.srcRow, false),
            );
            this.writeMachineCodeByte(0);
            this.writeMachineCodeByte(0);
        } else if (id.length > 0 && y && instruction.opcAbsoluteY >= 0) {
            this.writeMachineCodeByte(instruction.opcAbsoluteY);
            const addr = this.machineCode.bytes.length;
            this.unresolvedAddresses.push(
                new ASM_UnresolvedAddress(id, addr, this.srcRow, false),
            );
            this.writeMachineCodeByte(0);
            this.writeMachineCodeByte(0);
        } else if (id.length > 0 && instruction.opcAbsolute >= 0) {
            this.writeMachineCodeByte(instruction.opcAbsolute);
            const addr = this.machineCode.bytes.length;
            this.unresolvedAddresses.push(
                new ASM_UnresolvedAddress(id, addr, this.srcRow, false),
            );
            this.writeMachineCodeByte(0);
            this.writeMachineCodeByte(0);
        } else if (id.length > 0 && instruction.opcJumpAbsolute >= 0) {
            this.writeMachineCodeByte(instruction.opcJumpAbsolute);
            const addr = this.machineCode.bytes.length;
            this.unresolvedAddresses.push(
                new ASM_UnresolvedAddress(id, addr, this.srcRow, false, true),
            );
            this.writeMachineCodeByte(0);
            this.writeMachineCodeByte(0);
        } else if (id.length > 0 && instruction.opcJumpRelative >= 0) {
            this.writeMachineCodeByte(instruction.opcJumpRelative);
            const addr = this.machineCode.bytes.length;
            this.unresolvedAddresses.push(
                new ASM_UnresolvedAddress(id, addr, this.srcRow, true, true),
            );
            this.writeMachineCodeByte(0);
        } else if (asterisk && instruction.opcJumpAbsolute >= 0) {
            this.writeMachineCodeByte(instruction.opcJumpAbsolute);
            const addr =
                this.machineCode.startAddress +
                this.machineCode.bytes.length -
                1;
            this.writeMachineCodeByte(addr & 0xff);
            this.writeMachineCodeByte(addr >> 8);
        } else {
            this.error('invalid operand');
        }
    }

    private writeMachineCodeByte(b: number) {
        this.machineCode.bytes.push(b);
        this.machineCode.srcRows.push(this.tokenRow);
    }

    private isDEL(s: string): boolean {
        return this.token === s;
    }

    private isEnd(): boolean {
        return this.tokenType == TokenType.End;
    }

    private isID(): boolean {
        return this.tokenType == TokenType.Id;
    }

    private isHEX(): boolean {
        return this.tokenType == TokenType.Hex;
    }

    private DEL(terminal: string): void {
        if (this.token === terminal) this.next();
        else {
            terminal = terminal.replace('\n', '\\n').replace('\t', '\\t');
            this.error("expected '" + terminal + "'");
        }
    }

    private ID(): string {
        let id = '';
        if (this.tokenType == TokenType.Id) {
            id = this.token;
            this.next();
        } else this.error('expected ID');
        return id;
    }

    private HEX(): string {
        let hex = '';
        if (this.tokenType == TokenType.Hex) {
            hex = this.token;
            this.next();
        } else this.error('expected HEX');
        return hex;
    }

    private STR(): string {
        let str = '';
        if (this.tokenType == TokenType.Str) {
            str = this.token;
            this.next();
        } else this.error('expected STR');
        return str;
    }

    private error(msg: string): void {
        const s = '' + this.tokenRow + ':' + this.tokenCol + ':' + msg;
        this.errorString += s + '\n';
        throw Error(s);
    }

    getMachineCode(): ASM_Code {
        return this.machineCode;
    }

    getErrorString(): string {
        return this.errorString;
    }

    private next(): void {
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

enum TokenType {
    Unknown = 'unknown',
    Id = 'id',
    Hex = 'hex',
    Delimiter = 'delimiter',
    Str = 'str',
    End = 'end',
}
