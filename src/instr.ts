/******************************************************************************
 * C64 Assembler -- for the web                                               *
 * (c) 2022 by Andreas Schwenk, License: GPLv3                                *
 * mailto:contact@compiler-construction.com                                   *
 *****************************************************************************/

export const mos6502Instructions: { [mne: string]: MOS6502Instruction } = {};

export class MOS6502Instruction {
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
