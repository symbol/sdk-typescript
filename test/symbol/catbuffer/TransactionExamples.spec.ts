/*
 * Copyright 2021 SYMBOL
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Deadline, SymbolAddress } from '@core';
import { Converter } from '@utils';
import {
    AggregateCompleteTransactionBuilder,
    AmountDto,
    EmbeddedTransactionBuilder,
    EmbeddedTransferTransactionBuilder,
    EntityTypeDto,
    Hash256Dto,
    KeyDto,
    NetworkTypeDto,
    SignatureDto,
    TimestampDto,
    TransactionBuilder,
    TransferTransactionBodyBuilder,
    TransferTransactionBuilder,
    UnresolvedAddressDto,
    UnresolvedMosaicBuilder,
    UnresolvedMosaicIdDto,
} from 'catbuffer-typescript';
import { expect } from 'chai';

describe('Transfer Transaction Tests', () => {
    //SDK CODE
    const signerPublicKeyHex = 'AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C58900';
    const recipientAddressString = 'NATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA34SQ33Y';
    const addressBytes = SymbolAddress.createFromString(recipientAddressString).getAddressBytes();
    const recipientSymbolAddress = SymbolAddress.createFromBytes(addressBytes);
    const deadline = Deadline.createFromAdjustedValue(100);
    const mosaicIdNumber = BigInt(8589934593);

    //Catbuffer Code

    //Too many DTO objects that are just a a wrapper to a "primitive" type.
    const signature = new SignatureDto(Buffer.alloc(64));
    const signerPublicKey = new KeyDto(Converter.hexToUint8(signerPublicKeyHex));
    const version = 1;
    const networkType = NetworkTypeDto.PUBLIC;
    const type = EntityTypeDto.TRANSFER_TRANSACTION;
    const fee = new AmountDto(BigInt(1));
    const deadlineDto = new TimestampDto(BigInt(deadline.adjustedValue)); // Should adjusted value be a bigint?
    const recipientAddress = new UnresolvedAddressDto(recipientSymbolAddress.getAddressBytes());

    const mosaics = [
        new UnresolvedMosaicBuilder({ mosaicId: new UnresolvedMosaicIdDto(mosaicIdNumber), amount: new AmountDto(BigInt(1)) }),
    ];
    const message: Uint8Array = Buffer.alloc(0); //No message, we would need the crypto, plain capability eventually.

    it('Direct Example', () => {
        const transactionBuilder = new TransferTransactionBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
            signature: signature,
            signerPublicKey: signerPublicKey,
            version: version,
            network: networkType,
            type: type,
            fee: fee,
            deadline: deadlineDto,
        });

        expect(Converter.uint8ToHex(transactionBuilder.serialize())).eq(
            'B00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C589000000000001685441010000000000000064000000000000006826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF000001000000000001000000020000000100000000000000',
        );
    });

    it('Split Example', () => {
        const bodyBuilder = new TransferTransactionBodyBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
        });
        expect(Converter.uint8ToHex(bodyBuilder.serialize())).eq(
            '6826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF000001000000000001000000020000000100000000000000',
        );

        const transactionBuilder = new TransferTransactionBuilder({
            signature: signature,
            signerPublicKey: signerPublicKey,
            version: version,
            network: networkType,
            type: type,
            fee: fee,
            deadline: deadlineDto,
            ...bodyBuilder,
        });

        // Same result!
        expect(Converter.uint8ToHex(transactionBuilder.serialize())).eq(
            'B00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C589000000000001685441010000000000000064000000000000006826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF000001000000000001000000020000000100000000000000',
        );
    });

    it('Super Split Example', () => {
        const bodyBuilder = new TransferTransactionBodyBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
        });
        expect(Converter.uint8ToHex(bodyBuilder.serialize())).eq(
            '6826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF000001000000000001000000020000000100000000000000',
        );

        const transactionHeaders = new TransactionBuilder({
            signature: signature,
            signerPublicKey: signerPublicKey,
            version: version,
            network: networkType,
            type: type,
            fee: fee,
            deadline: deadlineDto,
        });

        const transactionBuilder = new TransferTransactionBuilder({
            ...transactionHeaders,
            ...bodyBuilder,
        });

        // Same result!
        expect(Converter.uint8ToHex(transactionBuilder.serialize())).eq(
            'B00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C589000000000001685441010000000000000064000000000000006826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF000001000000000001000000020000000100000000000000',
        );
    });

    it('Embedded Example', () => {
        // Body can be separate from the top level or aggregate transaction.
        const bodyBuilder = new TransferTransactionBodyBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
        });
        expect(Converter.uint8ToHex(bodyBuilder.serialize())).eq(
            '6826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF000001000000000001000000020000000100000000000000',
        );

        const transactionHeaders = new TransactionBuilder({
            signature: signature,
            signerPublicKey: signerPublicKey,
            version: version,
            network: networkType,
            type: type,
            fee: fee,
            deadline: deadlineDto,
        });

        // Same body for both top level and embedded
        const transactionBuilder = new TransferTransactionBuilder({
            ...transactionHeaders,
            ...bodyBuilder,
        });

        expect(Converter.uint8ToHex(transactionBuilder.serialize())).eq(
            'B00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C589000000000001685441010000000000000064000000000000006826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF000001000000000001000000020000000100000000000000',
        );
        // Same body for both top level and embedded
        const embeddedTransactionHeaders = new EmbeddedTransactionBuilder({
            signerPublicKey: signerPublicKey,
            version: version,
            network: networkType,
            type: type,
        });

        const embeddedTransactionBuilder = new EmbeddedTransferTransactionBuilder({
            ...embeddedTransactionHeaders,
            ...bodyBuilder,
        });

        expect(Converter.uint8ToHex(embeddedTransactionBuilder.serialize())).eq(
            '6000000000000000AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C5890000000000016854416826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF000001000000000001000000020000000100000000000000',
        );
    });

    it('Aggregate Example', () => {
        // Body can be separate from the top level or aggregate transaction.
        const bodyBuilder = new TransferTransactionBodyBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
        });

        // Same body for both top level and embedded
        const embeddedTransactionHeaders = new EmbeddedTransactionBuilder({
            signerPublicKey: signerPublicKey,
            version: version,
            network: networkType,
            type: type,
        });

        const embeddedTransactionBuilder = new EmbeddedTransferTransactionBuilder({
            ...embeddedTransactionHeaders,
            ...bodyBuilder,
        });

        const aggregate = new AggregateCompleteTransactionBuilder({
            signature: signature,
            signerPublicKey: signerPublicKey,
            version: version,
            type: EntityTypeDto.AGGREGATE_COMPLETE_TRANSACTION,
            fee: fee,
            deadline: deadlineDto,
            network: networkType,
            cosignatures: [],
            transactions: [embeddedTransactionBuilder],
            transactionsHash: new Hash256Dto(Buffer.alloc(32)),
        });

        expect(Converter.uint8ToHex(aggregate.serialize())).eq(
            '080100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C58900000000000168414101000000000000006400000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000006000000000000000AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C5890000000000016854416826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF000001000000000001000000020000000100000000000000',
        );
    });
});
