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

import { expect } from 'chai';
import { Key } from '../../src/core/Key';
import { SymbolKeyPair } from '../../src/core/symbol';
import { VotingKeysGenerator } from '../../src/core/symbol/VotingKeysGenerator';
import { Converter } from '../../src/core/utils/Converter';
import * as votingKeyVector from './resources/VotingKeyTestVector.json';

const fibPrivateKeyGenerator = (fillPrivateKey = false) => {
    let value1 = 1;
    let value2 = 2;

    return {
        generate: () => {
            const nextValue = value1 + value2;
            value1 = value2;
            value2 = nextValue;

            const seedValue = nextValue % 256;
            const buffer = Buffer.alloc(32);
            if (!fillPrivateKey) {
                return new SymbolKeyPair(new Key(Converter.numberToUint8(seedValue, 32).reverse()));
            }

            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = (seedValue + i) % 256;
            }
            return new SymbolKeyPair(new Key(buffer));
        },
    };
};

const seededPrivateKeyGenerator = (values: string[]) => {
    let nextIndex = 0;
    return {
        generate: () => {
            nextIndex += 1;
            return new SymbolKeyPair(Key.createFromHex(values[nextIndex - 1]));
        },
    };
};

const runTest = (vectorItem: any, keyGenerator: any): void => {
    // Arrange:
    const item = vectorItem;
    const rootKeyPair = new SymbolKeyPair(Key.createFromHex(item.root_private_key));
    const generator = new VotingKeysGenerator(rootKeyPair, keyGenerator.generate);

    // Act:
    const votingKeys = generator.generate(item.start_epoch, item.end_epoch);

    // Assert:
    expect(Converter.hexToUint8(item.expected_file_hex)).deep.equal(votingKeys);
};

describe('VotingKeyGenerator Vector', () => {
    it('Can generate voting keys from test vector_1', () => {
        runTest(votingKeyVector[0], fibPrivateKeyGenerator());
    });

    it('Can generate voting keys from test vector_2', () => {
        runTest(votingKeyVector[1], fibPrivateKeyGenerator(true));
    });

    it('Can generate voting keys from test vector_3', () => {
        // Arrange:
        const generator = seededPrivateKeyGenerator([
            '12F98B7CB64A6D840931A2B624FB1EACAFA2C25C3EF0018CD67E8D470A248B2F',
            'B5593870940F28DAEE262B26367B69143AD85E43048D23E624F4ED8008C0427F',
            '6CFC879ABCCA78F5A4C9739852C7C643AEC3990E93BF4C6F685EB58224B16A59',
        ]);

        // Act + Assert:
        runTest(votingKeyVector[2], generator);
    });
});
