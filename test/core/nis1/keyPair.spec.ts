import { expect } from 'chai';
import { KeyPair } from '../../../src/core/nis1';
import { NIS1_Key_Vector } from '../../resource/vector/nis1/1.test-keys';

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

    // it('Can generate keypair random', () => {
    //     // Act:
    //     const keyPair = KeyPair.generate();

    //     // Assert:
    //     expect(keyPair.PrivateKey).to.be.a('string');
    //     expect(keyPair.PublicKey).to.be.a('string');
    // });
});
