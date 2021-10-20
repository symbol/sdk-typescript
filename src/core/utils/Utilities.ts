/*
 * Copyright 2019 NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Alphabet, Encoded_Block_Size } from '@core';

interface Builder {
    map: Record<string, number>;
    addRange: (start: string, end: string, base: number) => void;
}

export const createBuilder = (): Builder => {
    const map: Record<string, number> = {};
    return {
        map,
        /**
         * Adds a range mapping to the map.
         *
         * @param start - The start character.
         * @param end - The end character.
         * @param base - The value corresponding to the start character.
         */
        addRange: (start: string, end: string, base: number): void => {
            const startCode = start.charCodeAt(0);
            const endCode = end.charCodeAt(0);

            for (let code = startCode; code <= endCode; ++code) {
                map[String.fromCharCode(code)] = code - startCode + base;
            }
        },
    };
};

const Char_To_Nibble_Map = (): Record<string, number> => {
    const builder = createBuilder();
    builder.addRange('0', '9', 0);
    builder.addRange('a', 'f', 10);
    builder.addRange('A', 'F', 10);
    return builder.map;
};

export const tryParseByte = (char1: string, char2: string): number | undefined => {
    const charMap = Char_To_Nibble_Map();
    const nibble1 = charMap[char1];
    const nibble2 = charMap[char2];
    return undefined === nibble1 || undefined === nibble2 ? undefined : (nibble1 << 4) | nibble2;
};

export const split = (name: string, processor: (start: number, index: number) => void): number => {
    let start = 0;
    for (let index = 0; index < name.length; ++index) {
        if ('.' === name[index]) {
            processor(start, index - start);
            start = index + 1;
        }
    }
    return start;
};

export const encodeBlock = (input: Uint8Array, inputOffset: number, output: string[], outputOffset: number): void => {
    output[outputOffset + 0] = Alphabet[input[inputOffset + 0] >> 3];
    output[outputOffset + 1] = Alphabet[((input[inputOffset + 0] & 0x07) << 2) | (input[inputOffset + 1] >> 6)];
    output[outputOffset + 2] = Alphabet[(input[inputOffset + 1] & 0x3e) >> 1];
    output[outputOffset + 3] = Alphabet[((input[inputOffset + 1] & 0x01) << 4) | (input[inputOffset + 2] >> 4)];
    output[outputOffset + 4] = Alphabet[((input[inputOffset + 2] & 0x0f) << 1) | (input[inputOffset + 3] >> 7)];
    output[outputOffset + 5] = Alphabet[(input[inputOffset + 3] & 0x7f) >> 2];
    output[outputOffset + 6] = Alphabet[((input[inputOffset + 3] & 0x03) << 3) | (input[inputOffset + 4] >> 5)];
    output[outputOffset + 7] = Alphabet[input[inputOffset + 4] & 0x1f];
};

export const Char_To_Decoded_Char_Map = (): Record<string, number> => {
    const builder = createBuilder();
    builder.addRange('A', 'Z', 0);
    builder.addRange('2', '7', 26);
    return builder.map;
};

export const decodeChar = (char: string): number => {
    const charMap = Char_To_Decoded_Char_Map();
    const decodedChar = charMap[char];
    if (undefined !== decodedChar) {
        return decodedChar;
    }
    throw Error(`illegal base32 character ${char}`);
};

export const decodeBlock = (input: string, inputOffset: number, output: Uint8Array, outputOffset: number): void => {
    const bytes = new Uint8Array(Encoded_Block_Size);
    for (let i = 0; i < Encoded_Block_Size; ++i) {
        bytes[i] = decodeChar(input[inputOffset + i]);
    }

    output[outputOffset + 0] = (bytes[0] << 3) | (bytes[1] >> 2);
    output[outputOffset + 1] = ((bytes[1] & 0x03) << 6) | (bytes[2] << 1) | (bytes[3] >> 4);
    output[outputOffset + 2] = ((bytes[3] & 0x0f) << 4) | (bytes[4] >> 1);
    output[outputOffset + 3] = ((bytes[4] & 0x01) << 7) | (bytes[5] << 2) | (bytes[6] >> 3);
    output[outputOffset + 4] = ((bytes[6] & 0x07) << 5) | bytes[7];
};

// eslint-disable-next-line
export const arrayDeepEqual = (first: any, second: any, numElementsToCompare = 0): boolean => {
    let length = numElementsToCompare;
    if (0 === length) {
        if (first.length !== second.length) {
            return false;
        }
        length = first.length;
    }
    if (length > first.length || length > second.length) {
        return false;
    }
    for (let i = 0; i < length; ++i) {
        if (first[i] !== second[i]) {
            return false;
        }
    }
    return true;
};
