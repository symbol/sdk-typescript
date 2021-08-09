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

import { Converter, MerkleHashBuilder } from '@core';
import { expect } from 'chai';
import * as Crypto from 'crypto';

describe('MerkleHashBuilder should', () => {
    const calculateMerkleHash = (hashes: Uint8Array[]) => {
        const builder = new MerkleHashBuilder();
        hashes.forEach((hash) => builder.update(hash));
        return builder.final();
    };

    it('Can build from zero hashes', () => {
        // Arrange:
        const builder = new MerkleHashBuilder();

        // Act:
        const rootHash = builder.final();

        // Assert:
        expect(rootHash).deep.equal(new Uint8Array(32));
    });

    it('Can build from one child', () => {
        // Arrange:
        const builder = new MerkleHashBuilder().update(
            Converter.hexToUint8('215B158F0BD416B596271BCE527CD9DC8E4A639CC271D896F9156AF6F441EEB9'),
        );

        // Act:
        const rootHash = builder.final();

        // Assert:
        expect(Converter.uint8ToHex(rootHash)).equal('215B158F0BD416B596271BCE527CD9DC8E4A639CC271D896F9156AF6F441EEB9');
    });

    it('Can build from balanced tree', () => {
        // Arrange:
        const builder = new MerkleHashBuilder()
            .update(Converter.hexToUint8('215B158F0BD416B596271BCE527CD9DC8E4A639CC271D896F9156AF6F441EEB9'))
            .update(Converter.hexToUint8('976C5CE6BF3F797113E5A3A094C7801C885DAF783C50563FFD3CA6A5EF580E25'));

        // Act:
        const rootHash = builder.final();

        // Assert:
        expect(Converter.uint8ToHex(rootHash)).equal('1C704E3AC99B124F92D2648649EC72C7A19EA4E2BB24F669B976180A295876FA');
    });

    it('Can build from unbalanced tree', () => {
        // Arrange:
        const builder = new MerkleHashBuilder()
            .update(Converter.hexToUint8('215B158F0BD416B596271BCE527CD9DC8E4A639CC271D896F9156AF6F441EEB9'))
            .update(Converter.hexToUint8('976C5CE6BF3F797113E5A3A094C7801C885DAF783C50563FFD3CA6A5EF580E25'))
            .update(Converter.hexToUint8('E926CC323886D47234BB0B49219C81E280E8A65748B437C2AE83B09B37A5AAF2'));

        // Act:
        const rootHash = builder.final();

        // Assert:
        expect(Converter.uint8ToHex(rootHash)).equal('5DC17B2409D50BCC7C1FAA720D0EC8B79A1705D0C517BCC0BDBD316540974D5E');
    });

    it('Change sub hash order changes merkle hash', () => {
        // Arrange:
        const hash1 = Array.from({ length: 8 }, () => Crypto.randomBytes(32));
        const hash2: Buffer[] = [];
        [0, 1, 2, 5, 4, 3, 6, 7].forEach((index) => hash2.push(hash1[index]));

        // Sanity:
        expect(hash1.length).equal(hash2.length);

        // Act:
        const merkle1 = calculateMerkleHash(hash1);
        const merkle2 = calculateMerkleHash(hash2);

        // Assert:
        expect(merkle1).not.deep.equal(merkle2);
    });

    it('Change sub hash changes merkle hash', () => {
        // Arrange:
        const hash1 = Array.from({ length: 8 }, () => Crypto.randomBytes(32));
        const hash2: Buffer[] = [];
        [0, 1, 2, 3, -1, 5, 6, 7].forEach((index) => hash2.push(index <= 0 ? Crypto.randomBytes(32) : hash1[index]));

        // Sanity:
        expect(hash1.length).equal(hash2.length);

        // Act:
        const merkle1 = calculateMerkleHash(hash1);
        const merkle2 = calculateMerkleHash(hash2);

        // Assert:
        expect(merkle1).not.deep.equal(merkle2);
    });
});
