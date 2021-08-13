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

import { Deadline, Key, SymbolAddress, SymbolNetwork, SymbolTransactionUtils } from '@core';
import {
    AmountDto,
    EmbeddedTransactionBuilder,
    EmbeddedTransferTransactionBuilder,
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
import * as Crypto from 'crypto';

describe('SymbolTransactionUtils', () => {
    const network = SymbolNetwork.findByName(SymbolNetwork.list(), 'testnet');
    if (!network) {
        throw new Error('Network must be found!');
    }

    const recipientAddressPublicKeyHex = 'BBB80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C58900';
    const rawAddress = network.createAddressFromPublicKey(Key.createFromHex(recipientAddressPublicKeyHex));
    const recipientSymbolAddress = new SymbolAddress(rawAddress);
    const deadline = Deadline.createFromAdjustedValue(100);
    const mosaicIdNumber = BigInt(8589934593);

    const mosaics = [
        new UnresolvedMosaicBuilder({ mosaicId: new UnresolvedMosaicIdDto(mosaicIdNumber), amount: new AmountDto(BigInt(1)) }),
    ];

    const networkType = NetworkTypeDto.PUBLIC;
    const fee = new AmountDto(BigInt(10));
    const deadlineDto = new TimestampDto(BigInt(deadline.adjustedValue)); // Should adjusted value be a bigint?
    const recipientAddress = new UnresolvedAddressDto(recipientSymbolAddress.getAddressBytes());

    it('toEmbedded when top level', () => {
        const message = Buffer.from([1, 2, 3, 4]);
        const expectedEmbeddedBuilder = new EmbeddedTransferTransactionBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
            signerPublicKey: KeyDto.createEmpty(),
            version: EmbeddedTransferTransactionBuilder.VERSION,
            network: networkType,
            type: EmbeddedTransferTransactionBuilder.ENTITY_TYPE,
        });

        const builder = new TransferTransactionBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
            signature: SignatureDto.createEmpty(),
            signerPublicKey: KeyDto.createEmpty(),
            version: TransferTransactionBuilder.VERSION,
            network: networkType,
            type: TransferTransactionBuilder.ENTITY_TYPE,
            fee: fee,
            deadline: deadlineDto,
        });
        const embeddedBuilder = SymbolTransactionUtils.toEmbedded(builder);
        expect(embeddedBuilder.constructor.name).eq('EmbeddedTransferTransactionBuilder');
        expect(embeddedBuilder).deep.eq(expectedEmbeddedBuilder);
    });

    it('toEmbedded when aggregate level', () => {
        const message = Buffer.from([1, 2, 3, 4]);
        const expectedEmbeddedBuilder = new EmbeddedTransferTransactionBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
            signerPublicKey: KeyDto.createEmpty(),
            version: EmbeddedTransferTransactionBuilder.VERSION,
            network: networkType,
            type: EmbeddedTransferTransactionBuilder.ENTITY_TYPE,
        });

        const embeddedBuilder = SymbolTransactionUtils.toEmbedded(expectedEmbeddedBuilder);
        expect(embeddedBuilder.constructor.name).eq('EmbeddedTransferTransactionBuilder');
        expect(embeddedBuilder).deep.eq(expectedEmbeddedBuilder);
    });

    it('toEmbedded invalid builder', () => {
        expect(() => SymbolTransactionUtils.toEmbedded(KeyDto.createEmpty())).to.throw('Builder KeyDto is not a transaction builder.');
    });

    it('toEmbedded abstract top level builder', () => {
        const builder = new TransactionBuilder({
            signature: SignatureDto.createEmpty(),
            signerPublicKey: KeyDto.createEmpty(),
            version: TransferTransactionBuilder.VERSION,
            network: networkType,
            type: TransferTransactionBuilder.ENTITY_TYPE,
            fee: fee,
            deadline: deadlineDto,
        });
        expect(() => SymbolTransactionUtils.toEmbedded(builder)).to.throw(
            'Builder TransactionBuilder is not a concrete transaction builder.',
        );
    });
    it('toEmbedded abstract top emb builder', () => {
        const builder = new EmbeddedTransactionBuilder({
            signerPublicKey: KeyDto.createEmpty(),
            version: TransferTransactionBuilder.VERSION,
            network: networkType,
            type: TransferTransactionBuilder.ENTITY_TYPE,
        });
        expect(() => SymbolTransactionUtils.toEmbedded(builder)).to.throw(
            'Builder EmbeddedTransactionBuilder is not a concrete transaction builder.',
        );
    });

    it('createEmbeddedFromBodyBuilder creates embedded transfer', () => {
        const message = Buffer.from([1, 2, 3, 4]);
        const signerPublicKey = new KeyDto(Crypto.randomBytes(32));
        const bodyBuilder = new TransferTransactionBodyBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
        });
        const builder = SymbolTransactionUtils.createEmbeddedFromBodyBuilder({
            network: networkType,
            signerPublicKey: signerPublicKey,
            bodyBuilder: bodyBuilder,
        });

        expect(builder.constructor.name).eq('EmbeddedTransferTransactionBuilder');
        expect(builder).deep.eq(
            new EmbeddedTransferTransactionBuilder({
                network: networkType,
                signerPublicKey: signerPublicKey,
                version: EmbeddedTransferTransactionBuilder.VERSION,
                type: EmbeddedTransferTransactionBuilder.ENTITY_TYPE,
                ...bodyBuilder,
            }),
        );
    });

    it('createFromBodyBuilder creates top level transfer', () => {
        const message = Buffer.from([1, 2, 3, 4]);
        const signerPublicKey = new KeyDto(Crypto.randomBytes(32));
        const signature = new SignatureDto(Crypto.randomBytes(64));
        const bodyBuilder = new TransferTransactionBodyBuilder({
            recipientAddress: recipientAddress,
            mosaics: mosaics,
            message: message,
        });
        const builder = SymbolTransactionUtils.createFromBodyBuilder({
            network: networkType,
            signerPublicKey: signerPublicKey,
            fee: fee,
            signature: signature,
            deadline: deadlineDto,
            bodyBuilder: bodyBuilder,
        });

        expect(builder.constructor.name).eq('TransferTransactionBuilder');
        expect(builder).deep.eq(
            new TransferTransactionBuilder({
                network: networkType,
                fee: fee,
                deadline: deadlineDto,
                signature: signature,
                signerPublicKey: signerPublicKey,
                version: TransferTransactionBuilder.VERSION,
                type: TransferTransactionBuilder.ENTITY_TYPE,
                ...bodyBuilder,
            }),
        );
    });
});
