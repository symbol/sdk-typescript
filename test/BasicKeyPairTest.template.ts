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

import { Key, KeyPair } from '@core';
import { expect } from 'chai';
import * as crypto from 'crypto';

interface KeyPairClass {
    new (privateKey: Key): KeyPair;
    generate(): KeyPair;
}

export const BasicKeyPairTester = (keyPairClass: KeyPairClass, deterministicPrivateKey: Key, expectedPublicKey: Key): void => {
    describe('key pair', () => {
        it('create key pair from private key', () => {
            // Act:
            const keyPair: KeyPair = new keyPairClass(deterministicPrivateKey);

            // Assert:
            expect(expectedPublicKey).to.be.deep.equal(keyPair.publicKey);
            expect(deterministicPrivateKey).to.be.deep.equal(keyPair.privateKey);
        });
    });

    describe('sign', () => {
        it('fills the signature', () => {
            // Arrange:
            const keyPair = keyPairClass.generate();
            const payload = crypto.randomBytes(100);

            // Act:
            const signature = keyPair.sign(payload);

            // Assert:
            expect(signature).to.not.deep.equal(new Uint8Array(64));
        });
        it('returns same signature for same data signed by same key pairs', () => {
            // Arrange:
            const privateKey = crypto.randomBytes(32);
            const keyPair1 = new keyPairClass(new Key(privateKey));
            const keyPair2 = new keyPairClass(new Key(privateKey));
            const payload = crypto.randomBytes(100);

            // Act:
            const signature1 = keyPair1.sign(payload);
            const signature2 = keyPair2.sign(payload);

            // Assert:
            expect(signature2).to.deep.equal(signature1);
        });

        it('returns different signature for same data signed by different key pairs', () => {
            // Arrange:
            const keyPair1 = keyPairClass.generate();
            const keyPair2 = keyPairClass.generate();
            const payload = crypto.randomBytes(100);

            // Act:
            const signature1 = keyPair1.sign(payload);
            const signature2 = keyPair2.sign(payload);

            // Assert:
            expect(signature2).to.not.deep.equal(signature1);
        });
    });

    describe('verify', () => {
        it('returns true for data signed with same key pair', () => {
            // Arrange:
            const keyPair = keyPairClass.generate();
            const payload = crypto.randomBytes(100);
            const signature = keyPair.sign(payload);

            // Act:
            const isVerified = keyPair.verify(payload, signature);

            // Assert:
            expect(isVerified).to.equal(true);
        });

        it('returns false for data signed with different key pair', () => {
            // Arrange:
            const keyPair1 = keyPairClass.generate();
            const keyPair2 = keyPairClass.generate();
            const payload = crypto.randomBytes(100);
            const signature = keyPair1.sign(payload);

            // Act:
            const isVerified = keyPair2.verify(payload, signature);

            // Assert:
            expect(isVerified).to.equal(false);
        });

        it('returns false if signature has been modified', () => {
            // Arrange:
            const keyPair = keyPairClass.generate();
            const payload = crypto.randomBytes(100);

            for (let i = 0; i < 64; i += 4) {
                const signature = keyPair.sign(payload);
                signature[i] ^= 0xff;

                // Act:
                const isVerified = keyPair.verify(payload, signature);

                // Assert:
                expect(isVerified, `signature modified at ${i}`).to.equal(false);
            }
        });

        it('returns false if payload has been modified', () => {
            // Arrange:
            const keyPair = keyPairClass.generate();
            const payload = crypto.randomBytes(44);

            for (let i = 0; i < payload.length; i += 4) {
                const signature = keyPair.sign(payload);
                payload[i] ^= 0xff;

                // Act:
                const isVerified = keyPair.verify(payload, signature);

                // Assert:
                expect(isVerified, `payload modified at ${i}`).to.equal(false);
            }
        });

        it('fails if public key does not correspond to private key', () => {
            // Arrange:
            const keyPair = keyPairClass.generate();
            const payload = crypto.randomBytes(100);
            const signature = keyPair.sign(payload);

            // Act:
            const isVerified = keyPairClass.generate().verify(payload, signature);

            // Assert:
            expect(isVerified).to.equal(false);
        });

        it('rejects zero public key', () => {
            // Arrange:
            const keyPair = keyPairClass.generate();
            Object.assign(keyPair, { publicKey: new Key(new Uint8Array(32)) });

            const payload = crypto.randomBytes(100);
            const signature = keyPair.sign(payload);

            // Act:
            const isVerified = keyPair.verify(payload, signature);

            // Assert:
            expect(isVerified).to.equal(false);
        });
    });

    describe('generate', () => {
        it('Can generate a random keypair', () => {
            // Act:
            const key = keyPairClass.generate();

            // Assert:
            expect(key).not.to.be.undefined;
            expect(key.privateKey.length).to.be.equal(32);
            expect(key.publicKey.length).to.be.equal(32);
        });
    });
};
