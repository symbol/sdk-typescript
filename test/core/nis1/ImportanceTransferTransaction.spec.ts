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
import { Deadline, ImportanceTransferMode, ImportanceTransferTransaction, Key, Nis1KeyPair, Nis1Network, Nis1TransactionType } from '@core';
import { expect } from 'chai';

describe('Nis1 ImportanceTransferTransaction', () => {
    const network = new Nis1Network('foo', 0x54);

    it('Can create transaction object', () => {
        // Arrange:
        const keyPair = Nis1KeyPair.generate();
        // Act:
        const transaction = new ImportanceTransferTransaction(keyPair.publicKey, ImportanceTransferMode.ACTIVATE);

        // Assert:
        expect(transaction).not.to.be.undefined;
        expect(transaction.fee).equal(BigInt(150000));
        expect(transaction.mode).equal(ImportanceTransferMode.ACTIVATE);
        expect(transaction.remotePublicKey.toBytes()).deep.equal(keyPair.publicKey.toBytes());
        expect(transaction.type).equal(Nis1TransactionType.IMPORTANCE_TRANSFER);
        expect(transaction.serialize().length).greaterThan(0);
        expect(transaction.size).equal(4 + 4 + 32);
    });

    it('Can serialize', () => {
        // Arrange:
        const signerPublicKey = Key.createFromHex('D6C3845431236C5A5A907A9E45BD60DA0E12EFD350B970E7F58E3499E2E7A2F0');
        const remotePubicKey = Key.createFromHex('9764026AA71A3CD0189990D1B7B8275B8D80863CF271235DFC745F30651E93AA');
        const factory = network.createTransactionFactory();
        const body = new ImportanceTransferTransaction(signerPublicKey, ImportanceTransferMode.ACTIVATE);
        const deadline = Deadline.createFromAdjustedValue(12345 + 24 * 60 * 60);
        const transaction = factory.create(deadline, remotePubicKey, body);

        // Act:
        const payload = transaction.serialize();

        // Assert:
        const expectedPayload = [
            [0x01, 0x08, 0x00, 0x00], // type
            [0x01, 0x00, 0x00, 0x54], // version
            [0x39, 0x30, 0x00, 0x00], // timestamp
            [0x20, 0x00, 0x00, 0x00], // public key length
            Array.from(transaction.signerPublicKey.toBytes()), // signer public key
            [0xf0, 0x49, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00], // fee
            [0xb9, 0x81, 0x01, 0x00], // deadline
            [0x01, 0x00, 0x00, 0x00], // mode
            [0x20, 0x00, 0x00, 0x00], // public key length
            Array.from((transaction.body as ImportanceTransferTransaction).remotePublicKey.toBytes()), // remote account public key
        ];
        const flattedExpectedBuffer = expectedPayload.reduce((array, value) => array.concat(value), []);
        expect(Array.from(payload)).deep.equal(flattedExpectedBuffer);
    });
});
