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
     *
     * @param rootKeyPair - The root keypair
     * @param keyPairGenerator - Symbol key pair generator
     */
    constructor(private readonly rootKeyPair: KeyPair, private readonly keyPairGenerator = SymbolKeyPair.generate) {}

    /**
     * Generate Symbol voting keys
     *
     * @param startEpoch - Start voting key epoch
     * @param endEpoch - End voting key epoch
     * @returns Voting keys buffer
     */
    public generate(startEpoch: number, endEpoch: number): Uint8Array {
        const items = endEpoch - startEpoch + 1;
        const headerSize = 64 + 16;
        const itemSize = 32 + 64;
        const totalSize = headerSize + items * itemSize;
        const buffer = Buffer.alloc(totalSize)
            .fill(Converter.numberToUint8(startEpoch, 8), 0)
            .fill(Converter.numberToUint8(endEpoch, 8), 8)
            .fill(Converter.hexToUint8('FFFFFFFFFFFFFFFF'), 16)
            .fill(Converter.hexToUint8('FFFFFFFFFFFFFFFF'), 24)
            .fill(this.rootKeyPair.publicKey.toBytes(), 32)
            .fill(Converter.numberToUint8(startEpoch, 8), 64)
            .fill(Converter.numberToUint8(endEpoch, 8), 72);

        for (let i = 0; i < items; i++) {
            const randomKeyPair = this.keyPairGenerator();
            buffer.fill(randomKeyPair.privateKey.toBytes(), 80 + i * itemSize);
            const identifier = Converter.numberToUint8(endEpoch - i, 8);
            const signature = this.rootKeyPair.sign(Uint8Array.from([...randomKeyPair.publicKey.toBytes(), ...identifier]));
            buffer.fill(signature, 80 + 32 + i * itemSize);
        }
        return buffer;
    }
}
