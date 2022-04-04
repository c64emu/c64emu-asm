/******************************************************************************
 * C64 Emulator -- for the web                                                *
 * (c) 2022 by Andreas Schwenk, License: GPLv3                                *
 * mailto:contact@compiler-construction.com                                   *
 *****************************************************************************/

import { ASM_MOS6502 } from './asm';

const prog = `; hello world
* = $4000
start
    ldx #$00
next
    lda msg,x
    sta $0400,x
    inx
    cpx #$13
    bne next
    jmp *
msg
    .text "HELLO, WORLD!"
`;

const assembler = new ASM_MOS6502();
if (assembler.assemble(prog)) {
    const mc = assembler.getMachineCode();
    let s = '';
    for (let i = 0; i < mc.bytes.length; i++) {
        if (i % 8 == 0)
            s +=
                '\n$' +
                (mc.startAddress + i)
                    .toString(16)
                    .padStart(4, '0')
                    .toUpperCase() +
                ': ';
        s += mc.bytes[i].toString(16).padStart(2, '0').toUpperCase() + ' ';
    }
    s = s.trim();
    console.log(s);
} else console.log('assemble failed. Error:' + assembler.getErrorString());

// compare to https://www.masswerk.at/6502/assembler.html
