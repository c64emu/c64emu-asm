/******************************************************************************
 * C64 Assembler -- for the web                                               *
 * (c) 2022 by Andreas Schwenk, License: GPLv3                                *
 * mailto:contact@compiler-construction.com                                   *
 *****************************************************************************/

import * as instr from './instr';
import * as code from './code';
import * as lex from './lexer';

// TODO: replace '##'
const screen_0ff =
    '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[£]## !"#$%&´()*+,-./0123456789:;<=>?';
const petscii_32ff =
    ' !"#$%&´()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[£]';

export class ASM_MOS6502 {
    private lexer: lex.Lexer = null;

    private labels: { [id: string]: code.ASM_Label } = {};
    private unresolvedAddresses: code.ASM_UnresolvedAddress[] = [];

    private machineCode: code.ASM_Code = null;

    assemble(src: string): boolean {
        this.lexer = new lex.Lexer(src);

        this.machineCode = new code.ASM_Code();
        this.machineCode.srcLines = src.split('\n');
        this.labels = {};
        this.unresolvedAddresses = [];

        // parse and generate machine code
        try {
            this.lexer.next();
            while (!this.lexer.isEnd()) {
                // TODO: catch parse errors!
                while (!this.lexer.isEnd() && this.lexer.isDEL('\n'))
                    this.lexer.next();
                if (!this.lexer.isEnd()) this.parseLine();
            }
        } catch (error) {
            return false;
        }
        // fix unresolved addresses
        for (const ua of this.unresolvedAddresses) {
            const label = this.labels[ua.label];
            if (label === undefined) {
                this.lexer.error(
                    "unresolved label '" + ua.label + "'",
                    ua.srcRow,
                    0,
                );
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
    //   | (" "|"\t") ID operand "\n"
    //   | (" "|"\t") "." "text" STR "\n"
    //   | (" "|"\t") "." "screen" STR "\n";
    private parseLine(): void {
        if (this.lexer.isDEL('*')) {
            this.lexer.next();
            this.lexer.DEL('=');
            const addrStr = this.lexer.HEX();
            if (addrStr.length != 4)
                this.lexer.error('start address must be 2 bytes long');
            this.machineCode.startAddress = parseInt(addrStr, 16);
            this.lexer.DEL('\n');
        } else if (this.lexer.isID()) {
            const id = this.lexer.getToken();
            this.lexer.next();
            const addr = this.machineCode.bytes.length;
            // TODO: handle duplicate labels correctly!
            this.labels[id] = new code.ASM_Label(id, addr);
            this.lexer.DEL('\n');
        } else if (this.lexer.isDEL(' ') || this.lexer.isDEL('\t')) {
            this.lexer.next();
            if (this.lexer.isID()) {
                const mnemonic = this.lexer.ID().toUpperCase();
                if (mnemonic in instr.mos6502Instructions == false)
                    this.lexer.error("unknown instruction '" + mnemonic + "'");
                const instruction = instr.mos6502Instructions[mnemonic];
                this.parseOperand(instruction);
            } else {
                this.lexer.DEL('.');
                if (!this.lexer.isDEL('text') && !this.lexer.isDEL('screen'))
                    this.lexer.error("expected 'text' or 'screen'");
                const isText = this.lexer.isDEL('text');
                this.lexer.next();
                const str = this.lexer.STR();
                for (const ch of str) {
                    if (isText && petscii_32ff.includes(ch)) {
                        const b = petscii_32ff.indexOf(ch) + 32;
                        this.writeMachineCodeByte(b);
                    } else if (!isText && screen_0ff.includes(ch)) {
                        const b = screen_0ff.indexOf(ch);
                        this.writeMachineCodeByte(b);
                    } else this.lexer.error("unknown character'" + ch + '');
                }
            }
            this.lexer.DEL('\n');
        } else {
            this.lexer.error('expected label or instruction');
        }
    }

    // Operand = "#" HEX
    //   | ID [ "," ("x"|"y") ]
    //   | HEX [ "," ("x"|"y") ]
    //   | "*"
    //   | epsilon;
    private parseOperand(instruction: instr.MOS6502Instruction): void {
        let implied = false;
        let immediate = false;
        let hexStr = '';
        let id = '';
        let asterisk = false;
        let x = false;
        let y = false;
        if (this.lexer.isDEL('#')) {
            this.lexer.next();
            immediate = true;
            hexStr = this.lexer.HEX();
        } else if (this.lexer.isID() || this.lexer.isHEX()) {
            if (this.lexer.isID()) id = this.lexer.ID();
            else hexStr = this.lexer.HEX();
            if (this.lexer.isDEL(',')) {
                this.lexer.next();
                if (this.lexer.isDEL('x')) {
                    this.lexer.next();
                    x = true;
                } else if (this.lexer.isDEL('y')) {
                    this.lexer.next();
                    y = true;
                } else this.lexer.error("expected 'x' or 'y'");
            }
        } else if (this.lexer.isDEL('*')) {
            this.lexer.next();
            asterisk = true;
        } else if (this.lexer.isDEL('\n')) {
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
                new code.ASM_UnresolvedAddress(
                    id,
                    addr,
                    this.lexer.getSrcRow(),
                    false,
                ),
            );
            this.writeMachineCodeByte(0);
            this.writeMachineCodeByte(0);
        } else if (id.length > 0 && y && instruction.opcAbsoluteY >= 0) {
            this.writeMachineCodeByte(instruction.opcAbsoluteY);
            const addr = this.machineCode.bytes.length;
            this.unresolvedAddresses.push(
                new code.ASM_UnresolvedAddress(
                    id,
                    addr,
                    this.lexer.getSrcRow(),
                    false,
                ),
            );
            this.writeMachineCodeByte(0);
            this.writeMachineCodeByte(0);
        } else if (id.length > 0 && instruction.opcAbsolute >= 0) {
            this.writeMachineCodeByte(instruction.opcAbsolute);
            const addr = this.machineCode.bytes.length;
            this.unresolvedAddresses.push(
                new code.ASM_UnresolvedAddress(
                    id,
                    addr,
                    this.lexer.getSrcRow(),
                    false,
                ),
            );
            this.writeMachineCodeByte(0);
            this.writeMachineCodeByte(0);
        } else if (id.length > 0 && instruction.opcJumpAbsolute >= 0) {
            this.writeMachineCodeByte(instruction.opcJumpAbsolute);
            const addr = this.machineCode.bytes.length;
            this.unresolvedAddresses.push(
                new code.ASM_UnresolvedAddress(
                    id,
                    addr,
                    this.lexer.getSrcRow(),
                    false,
                    true,
                ),
            );
            this.writeMachineCodeByte(0);
            this.writeMachineCodeByte(0);
        } else if (id.length > 0 && instruction.opcJumpRelative >= 0) {
            this.writeMachineCodeByte(instruction.opcJumpRelative);
            const addr = this.machineCode.bytes.length;
            this.unresolvedAddresses.push(
                new code.ASM_UnresolvedAddress(
                    id,
                    addr,
                    this.lexer.getSrcRow(),
                    true,
                    true,
                ),
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
            this.lexer.error('invalid operand');
        }
    }

    private writeMachineCodeByte(b: number) {
        this.machineCode.bytes.push(b);
        this.machineCode.srcRows.push(this.lexer.getTokenRow());
    }

    getMachineCode(): code.ASM_Code {
        return this.machineCode;
    }

    getErrorString(): string {
        return this.lexer.getErrorString();
    }
}
