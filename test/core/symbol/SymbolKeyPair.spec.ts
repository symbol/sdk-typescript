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

import { Key, SymbolKeyPair } from '@core';
import { expect } from 'chai';
import { BasicKeyPairTester } from '../../BasicKeyPairTest.template';

describe('Symbol key pair', () => {
    const deterministicPrivateKey = Key.createFromHex('575DBB3062267EFF57C970A336EBBC8FBCFE12C5BD3ED7BC11EB0481D7704CED');
    const expectedPublicKey = Key.createFromHex('2E834140FD66CF87B254A693A2C7862C819217B676D3943267156625E816EC6F');

    BasicKeyPairTester(SymbolKeyPair, deterministicPrivateKey, expectedPublicKey);

    describe('verify', () => {
        it('non canonical signature', () => {
            /**
             * @param scalar - scalar
             */
            function scalarAddGroupOrder(scalar: Uint8Array): void {
                // 2^252 + 27742317777372353535851937790883648493, little endian
                const Group_Order = [
                    0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10,
                ];

                let r = 0;
                for (let i = 0; i < scalar.length; ++i) {
                    const t = scalar[i] + Group_Order[i];
                    scalar[i] += Group_Order[i] + r;
                    r = (t >> 8) & 0xff;
                }
            }

            // Arrange:
            const keyPair: SymbolKeyPair = new SymbolKeyPair(deterministicPrivateKey);
            const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 11]);
            const canonicalSignature = keyPair.sign(payload);

            // this is signature with group order added to 'encodedS' part of signature
            const nonCanonicalSignature = canonicalSignature.slice();
            scalarAddGroupOrder(nonCanonicalSignature.subarray(32));

            // Act:
            const isCanonicalVerified = keyPair.verify(payload, canonicalSignature);
            const isNonCanonicalVerified = keyPair.verify(payload, nonCanonicalSignature);

            // Assert:
            expect(isCanonicalVerified).to.equal(true);
            expect(isNonCanonicalVerified).to.equal(false);
        });
    });
});
