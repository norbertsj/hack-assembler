#!/usr/bin/env node
'use strict';

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
 */

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
let latestCustomVariable = 16;

function getComputationValue(){}
function getDestinationValue(){}
function getJumpValue(){}

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
            } else {
                latestCustomVariable = latestCustomVariable === 16 ? latestCustomVariable : latestCustomVariable + 1;
                dataMemoryPool.push({ symbol, value: latestCustomVariable });
                result.push(`@${latestCustomVariable}`);
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
    console.log(preParsed);

    for (const line of preParsed) {
        if (isAinstruction(line)) {
            let binary = parseInt(line.replace('@', '')).toString(2);

            while (binary.length !== 15) {
                binary = '0' + binary;
            }
            
            result.push(binary);
        } else {
            // parse C instruction
        }
    }

    return result;
}

function readInput() {
    return [
        '// Fill.asm',
        '(LOOP)',
        '    @SCREEN  // just a test comment',
        '    D=A',
        '    @address',
        '    M=D',
        '',
        '    @KBD    ',
        '    D=M//comment',
        '    @FILL',
        '    D;JGT',
        '    @BLANK',
        '    D;JEQ',
        '',
        '(BLANK)',
        '    @address',
        '    D=M',
        '    @KBD',
        '    D=D-A',
        '    @LOOP',
        '    D;JEQ',
        '',
        '    @address',
        '    A=M',
        '    M=0',
        '    @address',
        '    M=M+1',
        '',
        '    @BLANK',
        '    0;JMP',
        '',
        '(FILL)',
        '    @address',
        '    D=M',
        '    @KBD',
        '    D=D-A',
        '    @LOOP',
        '    D;JEQ',
        '',
        '    @address',
        '    A=M',
        '    M=-1',
        '    @address',
        '    M=M+1',
        '',
        '    @FILL',
        '    0;JMP'
     ]
}

const input = readInput();
const output = assemble(input);
console.log(output);
