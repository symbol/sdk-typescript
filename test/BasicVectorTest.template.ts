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
import { deriveSharedKey, deriveSharedSecret, encode, Key, KeyPair, Network, SymbolIdGenerator } from '@core';
import { Converter } from '@utils';
import { toBufferLE } from 'bigint-buffer';
import { expect } from 'chai';
import { VectorTester } from './vector-tests/VectorTester';
const tester = new VectorTester();

interface KeyPairClass {
    new (privateKey: Key): KeyPair;
}

export const KeyPairVectorTester = (keyPairClass: KeyPairClass, testKeysVectorFile: string): void => {
    describe('key pair - test vector', () => {
        tester.run(
            testKeysVectorFile,
            (item: { privateKey: string; publicKey: string }) => {
                // Act:
                const keyPair = new keyPairClass(Key.createFromHex(item.privateKey));

                // Assert:
                const message = ` from ${item.privateKey}`;
                expect(keyPair.publicKey.toString(), `public ${message}`).equal(item.publicKey);
                expect(keyPair.privateKey.toString(), `private ${message}`).equal(item.privateKey);
            },
            'can extract from private key test vectors',
        );
    });
};

export const SignAndVerifyTester = (keyPairClass: KeyPairClass, testSignVectorFile: string): void => {
    describe('sign & verify- test vector', () => {
        tester.run(
            testSignVectorFile,
            (item: { privateKey: string; data: string; signature: string }) => {
                // Arrange:
                const keyPair = new keyPairClass(Key.createFromHex(item.privateKey));
                const payload = Converter.hexToUint8(item.data);

                // Act:
                const signature = keyPair.sign(payload);
                const isVerified = keyPair.verify(payload, signature);

                // Assert:
                const message = ` from ${item.privateKey}`;
                expect(Converter.uint8ToHex(signature).toUpperCase(), `private ${message}`).to.deep.equal(item.signature);
                expect(isVerified, `private ${message}`).to.equal(true);
            },
            'sign',
        );
    });
};

export const AddressMosaicIdTester = <T extends Network>(
    networks: readonly T[],
    testSignVectorFile: string,
    testMosaicId = false,
): void => {
    describe('address & mosaicId - test vector', () => {
        tester.run(
            testSignVectorFile,
            (item: { [x: string]: string }) => {
                networks.forEach((network) => {
                    //Load test vector addresses
                    const networkName = network.name === 'testnet' ? 'PublicTest' : 'Public';
                    const addressKeyName = `address_${networkName}`.replace('_t', 'T');
                    const mosaicKeyName = `mosaicId_${networkName}`.replace('_t', 'T');

                    // Act + address:
                    const address = network.createAddressFromPublicKey(Key.createFromHex(item.publicKey));
                    expect(item[addressKeyName]).to.be.equal(address.encoded);
                    if (testMosaicId) {
                        const mosaicId = SymbolIdGenerator.generateMosaicId(address, toBufferLE(BigInt(item['mosaicNonce']), 4));
                        expect(item[mosaicKeyName]).to.be.equal(mosaicId.toString(16).toLocaleUpperCase().padStart(16, '0'));
                    }
                });
            },
            'address & mosaic',
        );
    });
};

export const CipherVectorTester = (testCipherVectorFile: string): void => {
    describe('cipher - test vector', () => {
        tester.run(
            testCipherVectorFile,
            (item: { privateKey: string; otherPublicKey: string; tag: string; iv: string; cipherText: string; clearText: string }) => {
                // Act:
                const encoded = encode(
                    Key.createFromHex(item.privateKey),
                    Key.createFromHex(item.otherPublicKey),
                    Converter.hexToUint8(item.clearText),
                    Converter.hexToUint8(item.iv),
                );
                // Assert:
                const message = ` from ${item.clearText}`;
                expect(Converter.uint8ToHex(encoded), `cipher ${message}`).equal(`${item.tag}${item.iv}${item.cipherText}`);
            },
            'cipher test',
        );
    });
};

export const DeriveVectorTester = (testCipherVectorFile: string): void => {
    describe('Derive - test vector', () => {
        tester.run(
            testCipherVectorFile,
            (item: { privateKey: string; otherPublicKey: string; scalarMulResult: string; sharedKey: string }) => {
                // Act:
                const sharedSecret = deriveSharedSecret(
                    Key.createFromHex(item.privateKey).toBytes(),
                    Key.createFromHex(item.otherPublicKey).toBytes(),
                );
                const sharedKey = deriveSharedKey(
                    Key.createFromHex(item.privateKey).toBytes(),
                    Key.createFromHex(item.otherPublicKey).toBytes(),
                );
                // Assert:
                const message = ` from ${item.privateKey}`;
                expect(Converter.uint8ToHex(sharedSecret), `ScalarMulResult ${message}`).equal(item.scalarMulResult);
                expect(Converter.uint8ToHex(sharedKey), `SharedKey ${message}`).equal(item.sharedKey);
            },
            'derive test',
        );
    });
};
