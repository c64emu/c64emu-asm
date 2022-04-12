/******************************************************************************
 * C64 Assembler -- for the web                                               *
 * (c) 2022 by Andreas Schwenk, License: GPLv3                                *
 * mailto:contact@compiler-construction.com                                   *
 *****************************************************************************/

export class ASM_Label {
    label = '';
    codePosition = 0; // byte index in ASM_Code
    constructor(label = '', codePosition = 0) {
        this.label = label;
        this.codePosition = codePosition;
    }
}

export class ASM_UnresolvedAddress {
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
