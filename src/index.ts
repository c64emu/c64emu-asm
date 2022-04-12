/******************************************************************************
 * C64 Assembler -- for the web                                               *
 * (c) 2022 by Andreas Schwenk, License: GPLv3                                *
 * mailto:contact@compiler-construction.com                                   *
 *****************************************************************************/

import * as asm from './asm';

export interface AssembleResult {
    error: boolean;
    errorString: string;
    machineCode: Uint8Array;
    machineCodeAddress: number;
    stringifiedCode: string;
}

export function assemble6502(src: string): AssembleResult {
    const assembler = new asm.ASM_MOS6502();
    if (assembler.assemble(src) == false)
        return {
            error: true,
            errorString: assembler.getErrorString(),
            machineCode: null,
            machineCodeAddress: 0,
            stringifiedCode: '',
        };
    else {
        const mc = assembler.getMachineCode();
        return {
            error: false,
            errorString: '',
            machineCode: new Uint8Array(mc.bytes),
            machineCodeAddress: mc.startAddress,
            stringifiedCode: mc.toString({
                includeAddress: true,
                matchSourceCode: true,
                includeSourceCode: true,
                maxBytesPerRow: 8,
            }),
        };
    }
}
