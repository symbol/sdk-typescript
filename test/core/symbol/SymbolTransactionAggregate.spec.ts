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

import { Converter, Deadline, Key, SymbolAddress, SymbolKeyPair, SymbolNetwork, SymbolUnresolvedAddress } from '@core';
import {
    AmountDto,
    BlockDurationDto,
    Hash256Dto,
    HashLockTransactionBodyBuilder,
    TransferTransactionBodyBuilder,
    UnresolvedAddressDto,
    UnresolvedMosaicBuilder,
    UnresolvedMosaicIdDto,
} from 'catbuffer-typescript';
import { expect } from 'chai';

describe('Symbol Aggregate Transaction', () => {
    const network = SymbolNetwork.findByName(SymbolNetwork.list(), 'testnet');
    if (!network) {
        throw new Error('Network must be found!');
    }
    const factory = network.createTransactionFactory();

    // Too Many Symbol Prefixes, is it possible to use the network object to generate generic KeyPair, Address, mosaic id, namespce id, etc?
    //
    // Would Nis1 Transaction be super different?

    const mosaicId = BigInt('0x091F837E059AE13C'); // Testnet mosaic id

    const bobPrivateKey = 'AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C58900';
    const bob = new SymbolKeyPair(Key.createFromHex(bobPrivateKey));
    const bobAddress: SymbolUnresolvedAddress = new SymbolAddress(network.createAddressFromPublicKey(bob.publicKey));

    const alicePrivateKey = 'BBB80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C58900';
    const alice = new SymbolKeyPair(Key.createFromHex(alicePrivateKey));
    // const aliceAddress = new SymbolAddress(network.createAddressFromPublicKey(alice.publicKey));
    // Example: Use alias.
    const aliceAlias: SymbolUnresolvedAddress = factory.fullNameToNamespaceId('i.am.alice');

    const msgA = 'Hello Alice, I have sent you 1 XYM!';
    const msgB = 'Hello Bob, I have sent you 2 XYM!';

    const maxFee = BigInt(10000);

    // This could be in a helper class, maybe SymbolMessageUtils/Helper/Factory etc.
    function plain(plainText: string): Uint8Array {
        //0x00 is the message type for plain utf-8 encoded texts.
        return Converter.concat(Uint8Array.of(0x00), Converter.utf8ToUint8(plainText));
    }

    // Static deadline for payload assertions.
    const deadline = Deadline.createFromAdjustedValue(100);

    // Option one, create method with individual params.
    const bobTx = TransferTransactionBodyBuilder.createTransferTransactionBodyBuilder(
        new UnresolvedAddressDto(factory.toUnresolvedAddress(aliceAlias)),
        [
            new UnresolvedMosaicBuilder({
                mosaicId: new UnresolvedMosaicIdDto(mosaicId),
                amount: new AmountDto(BigInt(1000000)),
            }),
        ],
        plain(msgA),
    );

    // Option two, constructor with object param.
    const aliceTx = new TransferTransactionBodyBuilder({
        recipientAddress: new UnresolvedAddressDto(factory.toUnresolvedAddress(bobAddress)),
        mosaics: [
            new UnresolvedMosaicBuilder({
                mosaicId: new UnresolvedMosaicIdDto(mosaicId),
                amount: new AmountDto(BigInt(2000000)),
            }),
        ],
        message: plain(msgB),
    });

    it('Create simple transfer transaction complete', () => {
        const transaction = factory.create(deadline, maxFee, aliceTx);
        transaction.sign(alice);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            'D200000000000000F14850BFF9782333A43E00162893A7B7A54EF3EFA6CFBA2B0A128A949AC62AC599EF46A81E8D03BF370B05A631F10A4C4F11C4904B5927EBB4763F13D808E2064164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB6800000000019854411027000000000000640000000000000098EF5B217E87DF93F37A9F95444473C40D165C4192253DF522000100000000003CE19A057E831F0980841E00000000000048656C6C6F20426F622C204920686176652073656E7420796F7520322058594D21',
        );
        // announce aggregate complete.
    });

    it('create complete', () => {
        const transaction = factory.createAggregateComplete(deadline, maxFee, [
            factory.toEmbedded(aliceTx, alice.publicKey),
            factory.toEmbedded(bobTx, bob.publicKey),
        ]);
        transaction.signWithCosigners(alice, [bob]);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '20020000000000009A7B33D17394B7ACC8594559D0360CB425C33D8270FB893C41E9C8A9C7CF9EDEF4232708C056AC7114F7610ABB2F032017367B08B8A0625B05650971D2F7B60D4164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68000000000198414110270000000000006400000000000000B03F79D529E2DA7A2358EA39961E2D2B4EA46B47BED7C68DD1D61FE7DCDA8703100100000000000082000000000000004164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68000000000198544198EF5B217E87DF93F37A9F95444473C40D165C4192253DF522000100000000003CE19A057E831F0980841E00000000000048656C6C6F20426F622C204920686176652073656E7420796F7520322058594D210000000000008400000000000000462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F3000000000198544199C1ED94FF2D65C0AF00000000000000000000000000000024000100000000003CE19A057E831F0940420F00000000000048656C6C6F20416C6963652C204920686176652073656E7420796F7520312058594D21000000000000000000000000462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F329D4A35015F37C95924BA5799600D1238DDCEC76D32F12A906311916B40F91A4852DB548832A79685A7008379CA41AF9536B17362FF2523D65AF71AFA662E709',
        );
        // announce aggregate complete.
    });

    it('create complete with separated cosignature', () => {
        const transaction = factory.createAggregateComplete(deadline, maxFee, [
            factory.toEmbedded(aliceTx, alice.publicKey),
            factory.toEmbedded(bobTx, bob.publicKey),
        ]);
        transaction.sign(alice);

        // Created somewhere else
        const bobSignature = bob.sign(transaction.transactionHash);
        const bobCosignature = {
            signerPublicKey: bob.publicKey.key,
            signature: bobSignature,
        };
        transaction.addCosignatures([bobCosignature]);

        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '20020000000000009A7B33D17394B7ACC8594559D0360CB425C33D8270FB893C41E9C8A9C7CF9EDEF4232708C056AC7114F7610ABB2F032017367B08B8A0625B05650971D2F7B60D4164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68000000000198414110270000000000006400000000000000B03F79D529E2DA7A2358EA39961E2D2B4EA46B47BED7C68DD1D61FE7DCDA8703100100000000000082000000000000004164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68000000000198544198EF5B217E87DF93F37A9F95444473C40D165C4192253DF522000100000000003CE19A057E831F0980841E00000000000048656C6C6F20426F622C204920686176652073656E7420796F7520322058594D210000000000008400000000000000462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F3000000000198544199C1ED94FF2D65C0AF00000000000000000000000000000024000100000000003CE19A057E831F0940420F00000000000048656C6C6F20416C6963652C204920686176652073656E7420796F7520312058594D21000000000000000000000000462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F329D4A35015F37C95924BA5799600D1238DDCEC76D32F12A906311916B40F91A4852DB548832A79685A7008379CA41AF9536B17362FF2523D65AF71AFA662E709',
        );
        // announce aggregate complete.
    });

    it('create bonded', () => {
        const bondedTransaction = factory.createAggregateBonded(deadline, maxFee, [
            factory.toEmbedded(aliceTx, alice.publicKey),
            factory.toEmbedded(bobTx, bob.publicKey),
        ]);
        bondedTransaction.sign(alice);

        expect(Converter.uint8ToHex(bondedTransaction.payload)).eq(
            'B801000000000000060AADDBA81A3ED0E8702F45C67F5384525A4C6C4578A27A07CA6154F8CBC4063548447EEE6471114B7FF1862A695A56D3FFF61F956AD9BF43EA6F0EAF4B72094164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68000000000198414210270000000000006400000000000000B03F79D529E2DA7A2358EA39961E2D2B4EA46B47BED7C68DD1D61FE7DCDA8703100100000000000082000000000000004164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68000000000198544198EF5B217E87DF93F37A9F95444473C40D165C4192253DF522000100000000003CE19A057E831F0980841E00000000000048656C6C6F20426F622C204920686176652073656E7420796F7520322058594D210000000000008400000000000000462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F3000000000198544199C1ED94FF2D65C0AF00000000000000000000000000000024000100000000003CE19A057E831F0940420F00000000000048656C6C6F20416C6963652C204920686176652073656E7420796F7520312058594D2100000000',
        );

        const hashTransaction = factory.create(
            deadline,
            maxFee,
            new HashLockTransactionBodyBuilder({
                hash: new Hash256Dto(bondedTransaction.transactionHash),
                duration: new BlockDurationDto(BigInt(5760)),
                mosaic: new UnresolvedMosaicBuilder({
                    mosaicId: new UnresolvedMosaicIdDto(mosaicId),
                    amount: new AmountDto(BigInt(10000000)),
                }),
            }),
        );
        hashTransaction.sign(alice);
        expect(Converter.uint8ToHex(hashTransaction.payload)).eq(
            'B80000000000000087E4AD68C8918F02188321031B2413E7FD4D735099F0032D4E751FC084E7F70479DC51D309CB249FA10A077CC40FF32EEC35D357B921699D8054910435126F0E4164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB680000000001984841102700000000000064000000000000003CE19A057E831F0980969800000000008016000000000000B59560AC92236294F860AD9D59634BF10CDB47E72E7D5AE1263D610C25376820',
        );

        // announce hashTransaction.payload
        // announce aggregateBonded.payload

        const bobSignature = bob.sign(bondedTransaction.transactionHash);
        expect(Converter.uint8ToHex(bobSignature)).eq(
            'AFD7CDF5ADC74CCCE7DA78D2B657923C71BB027676CAEC9B8788C041416ADF0B4E611D06003634BBCE062E30AD9F2A16ACD56F848852F61A88D70FD8D5CD8F09',
        );

        //announce bobSignature
    });
});
