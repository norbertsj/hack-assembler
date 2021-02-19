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

function getComputationValue(){}
function getDestinationValue(){}
function getJumpValue(){}

// hmm, wait, isnt label an instruction number???
const LABEL_START = 16; // probably should change after variables are introduced
const labels = [];

function parseLabel(line) {
    const label = line.replace(/\(|\)/gm, '');

    const existing = labels.find(l => l.name === label);
    if (existing) {
        return existing.value;
    }

    const last = labels[labels.length - 1];
    let value;
    if (last) {
        value = last.value + 1;
    } else {
        value = LABEL_START;
    }

    labels.push({ name: label, value });
    return value;
}

function stripCommentsAndWhitespace(line) {
    return line.replace(/\/+.*$/gm, '').trim();
}

function isLabel(line) {
    return line.startsWith('(') && line.endsWith(')');
}

function isAinstruction(line) {
    return line.startsWith('@');
}

function assemble(input) {
    const output = [];

    if (!input || input.length === 0) {
        throw new Error('Invalid input');
    }

    for (let line of input) {
        line = stripCommentsAndWhitespace(line);

        if (line.length > 0) {
            let parsed;

            if (isLabel(line)) {
                // handle label
            } else if (isAinstruction(line)) {
                // handle A instruction and symbols
            } else {
                // handle C instruction
            }

            output.push(parsed);
        }
    }

    return output;
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
