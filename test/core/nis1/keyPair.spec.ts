import { expect } from 'chai';
import * as crypto from 'crypto';
import { KeyPair } from '../../../src/core/nis1';
import { Converter } from '../../../src/core/utils';
import { NIS1_Key_Vector } from '../../resource/vector/nis1/1.test-keys';
import { NIS1_Sign_Vector } from '../../resource/vector/nis1/2.test-sign';

describe('NIS key pair', () => {
    describe('construction', () => {
        it('can extract from private key test vectors', () => {
            NIS1_Key_Vector.forEach((kp) => {
                // Act:
                const keyPair = new KeyPair(kp.privateKey);
                // Assert:
                const message = ` from ${kp.privateKey}`;
                expect(keyPair.PublicKey, `public ${message}`).equal(kp.publicKey);
                expect(keyPair.PrivateKey, `private ${message}`).equal(kp.privateKey);
            });
        });

        it('cannot extract from invalid private key', () => {
            // Arrange:
            const invalidPrivateKeys = [
                '', // empty
                '53C659B47C176A70EB228DE5C0A0FF391282C96640C2A42CD5BBD0982176AB', // short
                '53C659B47C176A70EB228DE5C0A0FF391282C96640C2A42CD5BBD0982176AB1BBB', // long
                'EERRERE', // invalid
            ];

            // Act:
            invalidPrivateKeys.forEach((privateKey) => {
                // Assert:
                expect(() => {
                    new KeyPair(privateKey);
                }, `from ${privateKey}`).to.throw();
            });
        });
    });

    describe('sign & verify- Test Vector', () => {
        it('sign', () => {
            NIS1_Sign_Vector.forEach((s) => {
                // Arrange:
                const keyPair = new KeyPair(s.privateKey);
                const payload = Converter.hexToUint8(s.data);
                // Act:
                const signature = keyPair.sign(payload);
                // Assert:
                const message = `from ${s.privateKey}`;
                expect(Converter.uint8ToHex(signature).toUpperCase(), `private ${message}`).to.deep.equal(s.signature);
                const isVerified = keyPair.verify(payload, signature);
                expect(isVerified, `private ${message}`).to.equal(true);
            });
        });
    });

    describe('sign', () => {
        it('fills the signature', () => {
            // Arrange:
            const keyPair = KeyPair.generate();
            const payload = crypto.randomBytes(100);

            // Act:
            const signature = keyPair.sign(payload);

            // Assert:
            expect(signature).to.not.deep.equal(new Uint8Array(64));
        });
        it('returns same signature for same data signed by same key pairs', () => {
            // Arrange:
            const privateKey = Converter.uint8ToHex(crypto.randomBytes(32));
            const keyPair1 = new KeyPair(privateKey);
            const keyPair2 = new KeyPair(privateKey);
            const payload = crypto.randomBytes(100);

            // Act:
            const signature1 = keyPair1.sign(payload);
            const signature2 = keyPair2.sign(payload);

            // Assert:
            expect(signature2).to.deep.equal(signature1);
        });

        it('returns different signature for same data signed by different key pairs', () => {
            // Arrange:
            const keyPair1 = KeyPair.generate();
            const keyPair2 = KeyPair.generate();
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
            const keyPair = KeyPair.generate();
            const payload = crypto.randomBytes(100);
            const signature = keyPair.sign(payload);

            // Act:
            const isVerified = keyPair.verify(payload, signature);

            // Assert:
            expect(isVerified).to.equal(true);
        });

        it('returns false for data signed with different key pair', () => {
            // Arrange:
            const keyPair1 = KeyPair.generate();
            const keyPair2 = KeyPair.generate();
            const payload = crypto.randomBytes(100);
            const signature = keyPair1.sign(payload);

            // Act:
            const isVerified = keyPair2.verify(payload, signature);

            // Assert:
            expect(isVerified).to.equal(false);
        });

        it('returns false if signature has been modified', () => {
            // Arrange:
            const keyPair = KeyPair.generate();
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
            const keyPair = KeyPair.generate();
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
            const keyPair = KeyPair.generate();
            const payload = crypto.randomBytes(100);
            const signature = keyPair.sign(payload);

            // Act:
            const isVerified = KeyPair.generate().verify(payload, signature);

            // Assert:
            expect(isVerified).to.equal(false);
        });

        it('rejects zero public key', () => {
            // Arrange:
            const keyPair = KeyPair.generate();
            Object.assign(keyPair, { publicKey: new Uint8Array(32) });

            const payload = crypto.randomBytes(100);
            const signature = keyPair.sign(payload);

            // Act:
            const isVerified = keyPair.verify(payload, signature);

            // Assert:
            expect(isVerified).to.equal(false);
        });

        it('verify non canonical signature', () => {
            function scalarAddGroupOrder(scalar): void {
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
            const keyPair = KeyPair.generate();
            const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
            const canonicalSignature = keyPair.sign(payload);

            // this is signature with group order added to 'encodedS' part of signature
            const nonCanonicalSignature = canonicalSignature.slice();
            scalarAddGroupOrder(nonCanonicalSignature.subarray(32));

            // Act:
            const isCanonicalVerified = keyPair.verify(payload, canonicalSignature);
            const isNonCanonicalVerified = keyPair.verify(payload, nonCanonicalSignature);

            // Assert:
            expect(isCanonicalVerified).to.equal(true);
            expect(isNonCanonicalVerified).to.equal(true);
        });
    });

    describe('generate', () => {
        it('Can generate a random keypair', () => {
            // Act:
            const key = KeyPair.generate();

            // Assert:
            expect(key).not.to.be.undefined;
            expect(key.PrivateKey.length).to.be.equal(64);
            expect(key.PublicKey.length).to.be.equal(64);
        });
    });
});
