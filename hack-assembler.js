#!/usr/bin/env node
'use strict';

const { createReadStream, createWriteStream } = require('fs');
const { createInterface } = require('readline');

/**
 * A-instruction
 * @value
 * non-negative decimal constant
 * symbol referring to such a constant
 * binary syntax: 0 <value>
 *
 * C-instruction
 * dest = comp ; jump
 * binary syntax: 1 1 1 a c1 c2 c3 c4 c5 c6 d1 d2 d2 j1 j2 j3
 *
 * Computation table
 * |-----------|----|----|----|----|----|----|
 * |computation| c1 | c2 | c3 | c4 | c5 | c6 |
 * |-----|-----|----|----|----|----|----|----|
 * |  0  |     |  1 |  0 |  1 |  0 |  1 |  0 |
 * |  1  |     |  1 |  1 |  1 |  1 |  1 |  1 |
 * | -1  |     |  1 |  1 |  1 |  0 |  1 |  0 |
 * |  D  |     |  0 |  0 |  1 |  1 |  0 |  0 |
 * |  A  |  M  |  1 |  1 |  0 |  0 |  0 |  0 |
 * | !D  |     |  0 |  0 |  1 |  1 |  0 |  1 |
 * | !A  | !M  |  1 |  1 |  0 |  0 |  0 |  1 |
 * | -D  |     |  0 |  0 |  1 |  1 |  1 |  1 |
 * | -A  | -M  |  1 |  1 |  0 |  0 |  1 |  1 |
 * | D+1 |     |  0 |  1 |  1 |  1 |  1 |  1 |
 * | A+1 | M+1 |  1 |  1 |  0 |  1 |  1 |  1 |
 * | D-1 |     |  0 |  0 |  1 |  1 |  1 |  0 |
 * | A-1 | M-1 |  1 |  1 |  0 |  0 |  1 |  0 |
 * | D+A | D+M |  0 |  0 |  0 |  0 |  1 |  0 |
 * | D-A | D-M |  0 |  1 |  0 |  0 |  1 |  1 |
 * | A-D | M-D |  0 |  0 |  0 |  1 |  1 |  1 |
 * | D&A | D&M |  0 |  0 |  0 |  0 |  0 |  0 |
 * | D|A | D|M |  0 |  1 |  0 |  1 |  0 |  1 |
 * |-----|-----|----|----|----|----|----|----|
 * | a=0 | a=1 |                             |
 * |-----|-----|----|----|----|----|----|----|
 *
 * Destination table
 * |-----------|----|----|----|
 * |destination| d1 | d2 | d3 |
 * |-----------|----|----|----|
 * |   null    |  0 |  0 |  0 |
 * |     M     |  0 |  0 |  1 |
 * |     D     |  0 |  1 |  0 |
 * |    MD     |  0 |  1 |  1 |
 * |     A     |  1 |  0 |  0 |
 * |    AM     |  1 |  0 |  1 |
 * |    AD     |  1 |  1 |  0 |
 * |   AMD     |  1 |  1 |  1 |
 * |-----------|----|----|----|
 *
 * Jump table
 * |-----------|----|----|----|
 * |   jump    | j1 | j2 | j3 |
 * |-----------|----|----|----|
 * |   null    |  0 |  0 |  0 |
 * |   JGT     |  0 |  0 |  1 |
 * |   JEQ     |  0 |  1 |  0 |
 * |   JGE     |  0 |  1 |  1 |
 * |   JLT     |  1 |  0 |  0 |
 * |   JNE     |  1 |  0 |  1 |
 * |   JLE     |  1 |  1 |  0 |
 * |   JMP     |  1 |  1 |  1 |
 * |-----------|----|----|----|
 *
 * Pre-defined symbols
 * |--------|-------|
 * | symbol | value |
 * |--------|-------|
 * | R0     |   0   |
 * | R1     |   0   |
 * | R2     |   0   |
 * | ..     |   ..  |
 * | R15    |   15  |
 * | SCREEN | 16384 |
 * | KBD    | 24576 |
 * |--------|-------|
 * | SP     |   0   |
 * | LCL    |   1   |
 * | ARG    |   2   |
 * | THIS   |   3   |
 * | THAT   |   4   |
 * |--------|-------|
 *
 * Label declaration: (label)
 * Variable declaration: @variableName
 *
 * @todo:
 *  a) syntax validation
 *  b) file/path validation
 *  c) add proper error handling
 */

const computationTable0 = {
    '0': '101010',
    '1': '111111',
    '-1': '111010',
    'D': '001100',
    'A': '110000',
    '!D': '001101',
    '!A': '110001',
    '-D': '001111',
    '-A': '110011',
    'D+1': '011111',
    'A+1': '110111',
    'D-1': '001110',
    'A-1': '110010',
    'D+A': '000010',
    'D-A': '010011',
    'A-D': '000111',
    'D&A': '000000',
    'D|A': '010101'
}

const computationTable1 = {
    'M': '110000',
    '!M': '110001',
    '-M': '110011',
    'M+1': '110111',
    'M-1': '110010',
    'D+M': '000010',
    'D-M': '010011',
    'M-D': '000111',
    'D&M': '000000',
    'D|M': '010101'
}

const destinationTable = {
    '0': '000',
    'null': '000',
    'M': '001',
    'D': '010',
    'MD': '011',
    'A': '100',
    'AM': '101',
    'AD': '110',
    'AMD': '111'
}

const jumpTable = {
    'null': '000',
    'JGT': '001',
    'JEQ': '010',
    'JGE': '011',
    'JLT': '100',
    'JNE': '101',
    'JLE': '110',
    'JMP': '111'
};

const programMemoryPool = [];
const dataMemoryPool = [
    { symbol: 'R0', alternate: 'SP', value: 0 },
    { symbol: 'R1', alternate: 'LCL', value: 1 },
    { symbol: 'R2', alternate: 'ARG', value: 2 },
    { symbol: 'R3', alternate: 'THIS', value: 3 },
    { symbol: 'R4', alternate: 'THAT', value: 4 },
    { symbol: 'R5', value: 5 },
    { symbol: 'R6', value: 6 },
    { symbol: 'R7', value: 7 },
    { symbol: 'R8', value: 8 },
    { symbol: 'R9', value: 9 },
    { symbol: 'R10', value: 10 },
    { symbol: 'R11', value: 11 },
    { symbol: 'R12', value: 12 },
    { symbol: 'R13', value: 13 },
    { symbol: 'R14', value: 14 },
    { symbol: 'R15', value: 15 },
    { symbol: 'SCREEN', value: 16384 },
    { symbol: 'KBD', value: 24576 }
];
let latestCustomVariable = 15;

function getComputationAndA(value) {
    let a = 0;
    let comp;

    if (typeof computationTable1[value] !== 'undefined') {
        a = 1;
        comp = computationTable1[value];
    } else {
        comp = computationTable0[value];
    }

    return { a, comp };
}

function isLabel(line) {
    return line.startsWith('(') && line.endsWith(')');
}

function isAinstruction(line) {
    return line.startsWith('@');
}

function stripCommentsAndWhitespace(input) {
    const result = [];

    for (const line of input) {
        const stripped = line.replace(/\/+.*$/gm, '').trim();

        if (stripped.length > 0) {
            result.push(stripped);
        }
    }

    return result;
}

function parseLabels(input) {
    const result = [];

    for (const line of input) {
        if (isLabel(line)) {
            programMemoryPool.push({ symbol: line.replace(/\(|\)/g, ''), value: result.length });
        } else {
            result.push(line);
        }
    }

    return result;
}

function parseSymbols(input) {
    const result = [];

    for (const line of input) {
        if (isAinstruction(line)) {
            const symbol = line.replace('@', '');
            const variable = dataMemoryPool.find(i => i.symbol === symbol || i.alternate === symbol);
            const label = programMemoryPool.find(i => i.symbol === symbol);

            if (label) {
                result.push(`@${label.value}`);
            } else if (variable) {
                result.push(`@${variable.value}`);
            } else if (isNaN(parseInt(symbol))) {
                latestCustomVariable += 1;
                dataMemoryPool.push({ symbol, value: latestCustomVariable });
                result.push(`@${latestCustomVariable}`);
            } else {
                result.push(line);
            }
        } else {
            result.push(line);
        }
    }

    return result;
}

function assemble(input) {
    const result = [];

    if (!input || input.length === 0) {
        throw new Error('Invalid input');
    }

    const preParsed = parseSymbols(parseLabels(stripCommentsAndWhitespace(input)));

    for (const line of preParsed) {
        if (isAinstruction(line)) {
            // parse A instruction

            let binary = parseInt(line.replace('@', '')).toString(2);

            while (binary.length !== 16) {
                binary = '0' + binary;
            }

            result.push(binary);
        } else {
            // parse C instruction (dest = comp; jump)

            let a = 0;
            let comp;
            let dest = destinationTable['null'];
            let jump = jumpTable['null'];

            if (line.includes('=')) {
                const splitted = line.split('=');
                dest = destinationTable[splitted[0]];

                ({a, comp } = getComputationAndA(splitted[1]));
            } else {
                const splitted = line.split(';');
                jump = jumpTable[splitted[1]];

                ({a, comp } = getComputationAndA(splitted[0]));
            }

            result.push('111' + a + comp + dest + jump)
        }
    }

    return result;
}

function main() {
    const args = process.argv.slice(2);
    const path = args[0];

    if (!path) {
        console.log('Please provide ASM file as an argument (local dir only)');
        return;
    }

    const fileName = path.split('.')[0];
    const input = [];

    console.log(`Assembling ${fileName}.hack file...`)

    const rl = createInterface({
        input: createReadStream(path),
        crlfDelay: Infinity
    });

    rl.on('line', (line) => input.push(line));
    rl.on('close', () => {
        const output = assemble(input);
        const wstream = createWriteStream(`${fileName}.hack`);
        for (const line of output) {
            wstream.write(line + '\n');
        }

        console.log('Done');
    });
}

main();
