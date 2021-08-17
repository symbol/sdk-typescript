/*
import { SymbolKeyPair } from '../../../src/core/symbol/SymbolKeyPair';
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

import { Converter, Key, SymbolKeyPair, VotingKeysGenerator } from '@core';
import { toBufferLE } from 'bigint-buffer';
import { expect } from 'chai';

describe('VotingKeysGenerator', () => {
    it('can generate voting keys header', () => {
        // Arrange:
        const rootKeyPair = SymbolKeyPair.generate();
        const generator = new VotingKeysGenerator(rootKeyPair);

        // Act:
        const votingKeys = generator.generate(7, 11);

        // Assert:
        expect(votingKeys.length).equal(32 + 32 + 16 + 5 * (32 + 64));

        expect(Converter.uint8ToNumber(votingKeys.subarray(0, 8))).equal(7);
        expect(Converter.uint8ToNumber(votingKeys.subarray(8, 16))).equal(11);
        expect(Converter.uint8ToHex(votingKeys.subarray(16, 24))).equal('FFFFFFFFFFFFFFFF');
        expect(Converter.uint8ToHex(votingKeys.subarray(24, 32))).equal('FFFFFFFFFFFFFFFF');

        expect(votingKeys.subarray(32, 64)).deep.equal(rootKeyPair.publicKey.toBytes());
        expect(Converter.uint8ToNumber(votingKeys.subarray(64, 72))).equal(7);
        expect(Converter.uint8ToNumber(votingKeys.subarray(72, 80))).equal(11);
    });

    it('can generate random child keys', () => {
        // Arrange:
        const rootKeyPair = SymbolKeyPair.generate();
        const generator = new VotingKeysGenerator(rootKeyPair);

        // Act:
        const votingKeys = generator.generate(7, 11);
        let bytesWithoutHeader = votingKeys.subarray(32 + 32 + 16);

        // Assert:
        expect(votingKeys.length).equal(32 + 32 + 16 + 5 * (32 + 64));

        for (let i = 4; i >= 0; i--) {
            const childKeyPair = new SymbolKeyPair(new Key(bytesWithoutHeader.subarray(0, 32)));
            const signature = bytesWithoutHeader.subarray(32, 32 + 64);

            const payload = new Uint8Array(32 + 8);
            payload.set(childKeyPair.publicKey.toBytes(), 0);
            payload.set(toBufferLE(BigInt(7 + i), 8), 32);

            expect(rootKeyPair.verify(payload, signature)).to.be.true;
            bytesWithoutHeader = bytesWithoutHeader.subarray(32 + 64);
        }
    });
});
