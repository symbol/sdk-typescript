/*
 * Copyright 2021 SYMBOL
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

import { KeyPair } from '../KeyPair';
import { Converter } from '../utils';
import { SymbolKeyPair } from './SymbolKeyPair';

export class VotingKeysGenerator {
    /**
     * Constructor
     * @param {KePair} rootKeyPair The root keypair
     * @param privateKeyGenerator Private key generator
     */
    constructor(private readonly rootKeyPair: KeyPair, private readonly privateKeyGenerator = SymbolKeyPair.generate) {}

    /**
     * Generate Symbol voting keys
     * @param {number} startEpoch Start voting key epoch
     * @param {number} endEpoch End voting key epoch
     * @returns {Uint8Array}
     */
    public generate(startEpoch: number, endEpoch: number): Uint8Array {
        const items = endEpoch - startEpoch + 1;
        const headerSize = 64 + 16;
        const itemSize = 32 + 64;
        const totalSize = headerSize + items * itemSize;
        const result = new Uint8Array(totalSize);

        let offset = 0;
        offset = this.append(result, Converter.numberToUint8(startEpoch, 8), offset);
        offset = this.append(result, Converter.numberToUint8(endEpoch, 8), offset);
        offset = this.append(result, Converter.hexToUint8('FFFFFFFFFFFFFFFF'), offset);
        offset = this.append(result, Converter.hexToUint8('FFFFFFFFFFFFFFFF'), offset);
        offset = this.append(result, this.rootKeyPair.publicKey.toBytes(), offset);
        offset = this.append(result, Converter.numberToUint8(startEpoch, 8), offset);
        offset = this.append(result, Converter.numberToUint8(endEpoch, 8), offset);

        for (let i = 0; i < items; i++) {
            const randomKeyPair = this.privateKeyGenerator();
            offset = this.append(result, randomKeyPair.privateKey.toBytes(), offset);
            const identifier = Converter.numberToUint8(endEpoch - i, 8);
            const signature = this.rootKeyPair.sign(Uint8Array.from([...randomKeyPair.publicKey.toBytes(), ...identifier]));
            offset = this.append(result, signature, offset);
        }
        return result;
    }

    /**
     * Append bytes to another one and return the new offset index
     * @param {Uint8Array} target The target buffer
     * @param {Uint8Array} value The buffer to be appended
     * @param {number} index Offset
     * @returns {number}
     */
    private append(target: Uint8Array, value: Uint8Array, index: number): number {
        target.set(value, index);
        return index + value.length;
    }
}
