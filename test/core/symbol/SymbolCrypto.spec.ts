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

import { Converter, decode, encode, Key, SymbolKeyPair } from '@core';
import { expect } from 'chai';

describe('Symbol Crypto', () => {
    const sender = new SymbolKeyPair(Key.createFromHex('E1C8521608F4896CA26A0C2DE739310EA4B06861D126CF4D6922064678A1969B'));
    const recipient = new SymbolKeyPair(Key.createFromHex('A22A4BBF126A2D7D7ECE823174DFD184C5DE0FDE4CB2075D30CFA409F7EF8908'));
    const messageBytes = Converter.utf8ToUint8('NEM is awesome !');
    const customIV = Converter.hexToUint8('1D253DAF5C080DF0A3FD3F82');
    const emptyKey = new Key(new Uint8Array());

    const encodeAndDecodeAssert = (customIV?: Uint8Array): Uint8Array => {
        // Act:
        const encoded = encode(sender.privateKey, recipient.publicKey, messageBytes, customIV);
        const decoded = decode(recipient.privateKey, sender.publicKey, encoded);

        // Assert:
        expect(decoded).deep.equal(messageBytes);

        return encoded;
    };

    describe('Round Trip Test', () => {
        it('Can encode and decode message using random IV', () => {
            encodeAndDecodeAssert();
        });

        it('Can encode and decode message using provided IV', () => {
            encodeAndDecodeAssert(customIV);
        });
    });

    describe('Edge Case Tests', () => {
        describe('encode', () => {
            it('Encode throws if using empty key', () => {
                // Act+Assert:
                expect(() => {
                    encode(emptyKey, recipient.publicKey, messageBytes);
                }).to.throw();
                expect(() => {
                    encode(sender.privateKey, emptyKey, messageBytes);
                }).to.throw();
            });

            it('Encode throws if using empty message', () => {
                // Act+Assert:
                expect(() => {
                    encode(sender.privateKey, recipient.publicKey, new Uint8Array());
                }).to.throw();
            });

            it('Encode throws if using invalid IV', () => {
                // Act+Assert:
                expect(() => {
                    encode(sender.privateKey, recipient.publicKey, messageBytes, new Uint8Array(1));
                }).to.throw();
            });
        });

        describe('decode', () => {
            it('Decode throws if using empty key', () => {
                // Arrange:
                const encoded = encodeAndDecodeAssert();
                // Act+Assert:
                expect(() => {
                    decode(recipient.privateKey, emptyKey, encoded);
                }).to.throw();
                expect(() => {
                    decode(sender.privateKey, emptyKey, messageBytes);
                }).to.throw();
            });

            it('decode throws if using invalid payload', () => {
                // Arrange:
                const encoded = encodeAndDecodeAssert();

                // Act+Assert:
                expect(encoded.length).greaterThan(28); // Make sure IV & Tag are included
                expect(() => {
                    decode(recipient.privateKey, sender.publicKey, new Uint8Array(10));
                }).to.throw();
            });

            it('Can encode a message but failed decode with wrong key', () => {
                // Arrange:
                const invalidKey = Key.createFromHex('57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');

                // Act:
                const encoded = encodeAndDecodeAssert();

                // Assert:
                expect(() => {
                    decode(recipient.privateKey, invalidKey, encoded);
                }).to.throw('Unsupported state or unable to authenticate data');
                expect(() => {
                    decode(invalidKey, sender.publicKey, encoded);
                }).to.throw('Unsupported state or unable to authenticate data');
                expect(() => {
                    decode(invalidKey, invalidKey, encoded);
                }).to.throw('Unsupported state or unable to authenticate data');
            });
        });
    });
});
