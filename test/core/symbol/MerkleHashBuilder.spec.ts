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

    it('Can build from blanced tree', () => {
        // Arrange:
        const builder = new MerkleHashBuilder()
            .update(Converter.hexToUint8('215b158f0bd416b596271bce527cd9dc8e4a639cc271d896f9156af6f441eeb9'))
            .update(Converter.hexToUint8('976c5ce6bf3f797113e5a3a094c7801c885daf783c50563ffd3ca6a5ef580e25'));

        // Act:
        const rootHash = builder.final();

        // Assert:
        expect(Converter.uint8ToHex(rootHash).toLocaleLowerCase()).equal(
            '1c704e3ac99b124f92d2648649ec72c7a19ea4e2bb24f669b976180a295876fa',
        );
    });

    it('Can build from unblanced tree', () => {
        // Arrange:
        const builder = new MerkleHashBuilder()
            .update(Converter.hexToUint8('215b158f0bd416b596271bce527cd9dc8e4a639cc271d896f9156af6f441eeb9'))
            .update(Converter.hexToUint8('976c5ce6bf3f797113e5a3a094c7801c885daf783c50563ffd3ca6a5ef580e25'))
            .update(Converter.hexToUint8('e926cc323886d47234bb0b49219c81e280e8a65748b437c2ae83b09b37a5aaf2'));

        // Act:
        const rootHash = builder.final();

        // Assert:
        expect(Converter.uint8ToHex(rootHash).toLocaleLowerCase()).equal(
            '5dc17b2409d50bcc7c1faa720d0ec8b79a1705d0c517bcc0bdbd316540974d5e',
        );
    });

    it('Can build from unblanced tree', () => {
        // Arrange:
        const builder = new MerkleHashBuilder()
            .update(Converter.hexToUint8('215b158f0bd416b596271bce527cd9dc8e4a639cc271d896f9156af6f441eeb9'))
            .update(Converter.hexToUint8('976c5ce6bf3f797113e5a3a094c7801c885daf783c50563ffd3ca6a5ef580e25'))
            .update(Converter.hexToUint8('e926cc323886d47234bb0b49219c81e280e8a65748b437c2ae83b09b37a5aaf2'));

        // Act:
        const rootHash = builder.final();

        // Assert:
        expect(Converter.uint8ToHex(rootHash).toLocaleLowerCase()).equal(
            '5dc17b2409d50bcc7c1faa720d0ec8b79a1705d0c517bcc0bdbd316540974d5e',
        );
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
