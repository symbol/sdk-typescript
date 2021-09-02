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
import { Deadline, ImportanceTransferMode, ImportanceTransferTransaction, NemKeyPair, NemNetwork, NemTransactionType } from '@core';
import { expect } from 'chai';
import { NemTransaction } from '../../../src/core/nem/NemTransaction';

describe('NemTransaction', () => {
    const network = new NemNetwork('foo', 0x54);

    const createTransaction = (keyPair: NemKeyPair) => {
        const deadline = Deadline.createFromAdjustedValue(12345 + 24 * 60 * 60);
        const body = new ImportanceTransferTransaction(keyPair.publicKey, ImportanceTransferMode.ACTIVATE);
        return new NemTransaction(network, deadline, keyPair.publicKey, body);
    };

    const verifyTransactionCreation = (
        transaction: NemTransaction<ImportanceTransferTransaction>,
        keyPair: NemKeyPair,
        withoutSignature = true,
    ) => {
        expect(transaction).not.to.be.undefined;
        expect(transaction.body.fee).equal(BigInt(150000));
        expect(transaction.body.mode).equal(ImportanceTransferMode.ACTIVATE);
        expect(transaction.body.remotePublicKey.toBytes()).deep.equal(keyPair.publicKey.toBytes());
        expect(transaction.type).equal(NemTransactionType.IMPORTANCE_TRANSFER);
        expect(transaction.serialize().length).greaterThan(0);
        withoutSignature
            ? expect(transaction.payload).deep.equal(transaction.serialize())
            : expect(transaction.payload).not.deep.equal(transaction.serialize());
    };

    it('Can create transaction object', () => {
        // Arrange:
        const keyPair = NemKeyPair.generate();

        // Act + Assert:
        verifyTransactionCreation(createTransaction(keyPair), keyPair);
    });

    it('Can sign and attach signature', () => {
        // Arrange:
        const keyPair = NemKeyPair.generate();
        const transaction = createTransaction(keyPair);

        // Act:
        transaction.sign(keyPair);

        // Assert:
        verifyTransactionCreation(transaction, keyPair, false);
        expect(transaction.signature).deep.equal(keyPair.sign(transaction.serialize()));
        expect(transaction.payload.length).equal(transaction.serialize().length + 72);
    });
});
