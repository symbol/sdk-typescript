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
import { ImportanceTransferMode, ImportanceTransferTransaction, Nis1Deadline, Nis1KeyPair, Nis1Network, Nis1TransactionType } from '@core';
import { expect } from 'chai';
import { Nis1Transaction } from '../../../src/core/nis1/Nis1Transaction';

describe('Nis1Transaction', () => {
    const network = new Nis1Network('foo', 0x54);

    const createTransaction = (keyPair: Nis1KeyPair) => {
        const deadline = Nis1Deadline.createFromAdjustedValue(12345 + 24 * 60 * 60);
        const body = new ImportanceTransferTransaction(keyPair.publicKey, ImportanceTransferMode.ACTIVATE);
        return new Nis1Transaction(network, deadline, keyPair.publicKey, body);
    };

    const veryTransactionCreation = (
        transaction: Nis1Transaction<ImportanceTransferTransaction>,
        keyPair: Nis1KeyPair,
        withoutSignature = true,
    ) => {
        expect(transaction).not.to.be.undefined;
        expect(transaction.body.fee).equal(BigInt(150000));
        expect(transaction.body.mode).equal(ImportanceTransferMode.ACTIVATE);
        expect(transaction.body.remotePublicKey.toBytes()).deep.equal(keyPair.publicKey.toBytes());
        expect(transaction.type).equal(Nis1TransactionType.IMPORTANCE_TRANSFER);
        expect(transaction.serialize().length).greaterThan(0);
        withoutSignature
            ? expect(transaction.payload).deep.equal(transaction.serialize())
            : expect(transaction.payload).not.deep.equal(transaction.serialize());
    };

    it('Can create transaction object', () => {
        // Arrange:
        const keyPair = Nis1KeyPair.generate();

        // Act + Assert:
        veryTransactionCreation(createTransaction(keyPair), keyPair);
    });

    it('Can sign and attach signature', () => {
        // Arrange:
        const keyPair = Nis1KeyPair.generate();
        const transaction = createTransaction(keyPair);

        // Act:
        transaction.sign(keyPair);

        // Assert:
        veryTransactionCreation(transaction, keyPair, false);
        expect(transaction.signature).deep.equal(keyPair.sign(transaction.serialize()));
        expect(transaction.payload.length).equal(transaction.serialize().length + 72);
    });
});
