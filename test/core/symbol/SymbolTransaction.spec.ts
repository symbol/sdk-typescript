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

import { Converter, Deadline, Key, SymbolAddress, SymbolKeyPair, SymbolNetwork, SymbolTransactionUtils } from '@core';
import {
    AmountDto,
    KeyDto,
    NetworkTypeDto,
    SignatureDto,
    TimestampDto,
    TransferTransactionBodyBuilder,
    TransferTransactionBuilder,
    UnresolvedAddressDto,
    UnresolvedMosaicBuilder,
    UnresolvedMosaicIdDto,
} from 'catbuffer-typescript';
import { expect } from 'chai';

describe('Symbol Transfer Transaction', () => {
    const network = SymbolNetwork.findByName(SymbolNetwork.list(), 'mainnet');
    if (!network) {
        throw new Error('Network must be found!');
    }

    const signerPrivateKeyHex = 'AAA80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C58900';
    const signer = new SymbolKeyPair(Key.createFromHex(signerPrivateKeyHex));

    const cosigner1PrivateKeyHex = 'BBB80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C58900';
    const cosigner1 = new SymbolKeyPair(Key.createFromHex(cosigner1PrivateKeyHex));

    const cosigner2PrivateKeyHex = 'CCC80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C58900';
    const cosigner2 = new SymbolKeyPair(Key.createFromHex(cosigner2PrivateKeyHex));

    const recipientAddressPublicKeyHex = 'BBB80097FB6A1F287ED2736A597B8EA7F08D20F1ECDB9935DE6694ECF1C58900';
    const rawAddress = network.createAddressFromPublicKey(Key.createFromHex(recipientAddressPublicKeyHex));
    const recipientSymbolAddress = new SymbolAddress(rawAddress);
    const deadline = Deadline.createFromAdjustedValue(100);
    const namespaceId = BigInt(8589934593);

    const mosaics = [new UnresolvedMosaicBuilder({ mosaicId: new UnresolvedMosaicIdDto(namespaceId), amount: new AmountDto(BigInt(1)) })];
    const message = Buffer.alloc(0); //No message, we would need the crypto, plain capability eventually.

    const networkType = NetworkTypeDto.PUBLIC;
    const fee = new AmountDto(BigInt(10));
    const deadlineDto = new TimestampDto(BigInt(deadline.adjustedValue)); // Should adjusted value be a bigint?
    const recipientAddress = new UnresolvedAddressDto(recipientSymbolAddress.getAddressBytes());
    const factory = network.createTransactionFactory();

    const bodyBuilder = new TransferTransactionBodyBuilder({
        recipientAddress: recipientAddress,
        mosaics: mosaics,
        message: message,
    });

    const builder = new TransferTransactionBuilder({
        signature: SignatureDto.createEmpty(),
        signerPublicKey: KeyDto.createEmpty(),
        version: TransferTransactionBuilder.VERSION,
        network: networkType,
        type: TransferTransactionBuilder.ENTITY_TYPE,
        fee: fee,
        deadline: deadlineDto,
        ...bodyBuilder,
    });

    it('create from builder and payloads', () => {
        const transaction1 = factory.createFromBuilder(builder);
        const transaction2 = factory.createFromPayload(builder.serialize());
        expect(transaction1).deep.eq(transaction2);
    });

    it('sign transaction', () => {
        const transaction = factory.createFromBuilder(builder);
        expect(transaction.isAggregate).eq(false);

        // Initially it's not signed.
        expect(Converter.uint8ToHex(transaction.builder.signature.signature)).eq(
            '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        );
        expect(transaction.signerPublicKey.toString()).eq('0000000000000000000000000000000000000000000000000000000000000000');
        expect(signer.verify(transaction.signingData, transaction.builder.signature.signature)).eq(false);

        transaction.sign(signer);

        // Now it's signed
        expect(transaction.signerPublicKey.toString()).eq(signer.publicKey.toString());
        expect(Converter.uint8ToHex(transaction.builder.signature.signature)).eq(
            '489E87C06864053CD6CAEF9F15D022A46C45A0B4979E416FE2A45B56624B3A96BEDA6AFA694C2DD02518A93E97862A68A25FF9FD2E21E4E90B1B7FF4BD5A5E0F',
        );
        expect(signer.verify(transaction.signingData, transaction.builder.signature.signature)).eq(true);
    });

    it('Transaction hash', () => {
        const transaction = factory.createFromBuilder(builder);
        expect(transaction.isAggregate).eq(false);

        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('E31D932DF71056D12AD3F07419D17C0F22A1CD236D18207D04DBF95338EB40FB');

        transaction.sign(signer);

        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('A3FBAD610AA4CDB364C8F79AF427AB7584E36A9CBDFA216F9081075862A4D140');
    });

    it('Transaction payload', () => {
        const transaction = factory.createFromBuilder(builder);
        expect(transaction.isAggregate).eq(false);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            'B00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016854410A000000000000006400000000000000681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF000001000000000001000000020000000100000000000000',
        );

        transaction.sign(signer);

        expect(Converter.uint8ToHex(transaction.payload)).eq(
            'B000000000000000489E87C06864053CD6CAEF9F15D022A46C45A0B4979E416FE2A45B56624B3A96BEDA6AFA694C2DD02518A93E97862A68A25FF9FD2E21E4E90B1B7FF4BD5A5E0F462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F300000000016854410A000000000000006400000000000000681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF000001000000000001000000020000000100000000000000',
        );
    });

    it('Transaction to Aggregate, sign', () => {
        const transaction = factory.createAggregateComplete(deadline, fee.amount, [builder]);
        expect(transaction.isAggregate).eq(true);
        expect(transaction.size).eq(264);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '080100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF000001000000000001000000020000000100000000000000',
        );
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('879697DEA66ED22E3EC0136BD77352037BAEFC6DE56D1BA9B9B8A61F9E463BB2');
        transaction.sign(signer);
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('04B1BCD281D9EBB5C5FC13190410514D9A279ED502A988E285622CCCD977B975');
        const aggregateBuilder = transaction.builder;
        expect(aggregateBuilder.transactions.length).deep.eq(1);
        expect(aggregateBuilder.transactions[0]).deep.eq(SymbolTransactionUtils.toEmbedded(builder));
        expect(aggregateBuilder.cosignatures.length).deep.eq(0);

        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '0801000000000000FEE908835B3B4DBDC46A52536FA01ADC6C563D3FAFB3F41CD6193CFAD14E011EE389B88707EA9BE79D07ECCF0FE02E8DF277E3E55F957A972C1FD1E463564105462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F300000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF000001000000000001000000020000000100000000000000',
        );
        expect(transaction.size).eq(264);
    });

    it('Transaction to Aggregate, sign and cosign', () => {
        const transaction = factory.createAggregateComplete(deadline, fee.amount, [builder]);
        expect(transaction.isAggregate).eq(true);
        expect(transaction.size).eq(264);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '080100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF000001000000000001000000020000000100000000000000',
        );
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('879697DEA66ED22E3EC0136BD77352037BAEFC6DE56D1BA9B9B8A61F9E463BB2');
        transaction.sign(signer);
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('04B1BCD281D9EBB5C5FC13190410514D9A279ED502A988E285622CCCD977B975');
        transaction.cosign([cosigner1, cosigner2]);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            'D801000000000000FEE908835B3B4DBDC46A52536FA01ADC6C563D3FAFB3F41CD6193CFAD14E011EE389B88707EA9BE79D07ECCF0FE02E8DF277E3E55F957A972C1FD1E463564105462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F300000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF00000100000000000100000002000000010000000000000000000000000000004164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68A9283775173B54FB75B47CCBD0EC7E77C282DE6F496B684A605DCDAACEFC26641B7177A33EFF63589944A5951321768778AD0CDED22FC8A814352FE4FD953F0C000000000000000001AA3E0E38371A4F53CE30B61C9FE2D8E8CDC2E578509BFF5FDFFE72CD4B090FD75ED22BAE3DA059618EFA25EB036BD06E2540097920202493EC56408F20E648BFBB47EE996B784380CAE3E52FC32C7044F0459E4D3627DAEE2DEC1CC4351C00',
        );
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('04B1BCD281D9EBB5C5FC13190410514D9A279ED502A988E285622CCCD977B975');
        const aggregateBuilder = transaction.builder;
        expect(aggregateBuilder.transactions.length).deep.eq(1);
        expect(aggregateBuilder.transactions[0]).deep.eq(SymbolTransactionUtils.toEmbedded(builder));
        expect(aggregateBuilder.cosignatures.length).deep.eq(2);
        expect(aggregateBuilder.cosignatures[0].signerPublicKey.serialize()).deep.eq(cosigner1.publicKey.toBytes());
        expect(aggregateBuilder.cosignatures[1].signerPublicKey.serialize()).deep.eq(cosigner2.publicKey.toBytes());
        expect(transaction.size).eq(264 + 104 * 2);
    });

    it('Transaction to Aggregate, sign and cosign 2 operations', () => {
        const transaction = factory.createAggregateComplete(deadline, fee.amount, [builder]);
        expect(transaction.isAggregate).eq(true);
        expect(transaction.size).eq(264);

        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '080100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF000001000000000001000000020000000100000000000000',
        );
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('879697DEA66ED22E3EC0136BD77352037BAEFC6DE56D1BA9B9B8A61F9E463BB2');
        transaction.sign(signer);
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('04B1BCD281D9EBB5C5FC13190410514D9A279ED502A988E285622CCCD977B975');
        transaction.cosign([cosigner1]);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '7001000000000000FEE908835B3B4DBDC46A52536FA01ADC6C563D3FAFB3F41CD6193CFAD14E011EE389B88707EA9BE79D07ECCF0FE02E8DF277E3E55F957A972C1FD1E463564105462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F300000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF00000100000000000100000002000000010000000000000000000000000000004164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68A9283775173B54FB75B47CCBD0EC7E77C282DE6F496B684A605DCDAACEFC26641B7177A33EFF63589944A5951321768778AD0CDED22FC8A814352FE4FD953F0C',
        );
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('04B1BCD281D9EBB5C5FC13190410514D9A279ED502A988E285622CCCD977B975');

        const aggregateBuilderFirst = transaction.builder;
        expect(aggregateBuilderFirst.transactions.length).deep.eq(1);
        expect(aggregateBuilderFirst.transactions[0]).deep.eq(SymbolTransactionUtils.toEmbedded(builder));
        expect(aggregateBuilderFirst.cosignatures.length).deep.eq(1);
        expect(aggregateBuilderFirst.cosignatures[0].signerPublicKey.serialize()).deep.eq(cosigner1.publicKey.toBytes());

        transaction.cosign([cosigner2]);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            'D801000000000000FEE908835B3B4DBDC46A52536FA01ADC6C563D3FAFB3F41CD6193CFAD14E011EE389B88707EA9BE79D07ECCF0FE02E8DF277E3E55F957A972C1FD1E463564105462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F300000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF00000100000000000100000002000000010000000000000000000000000000004164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68A9283775173B54FB75B47CCBD0EC7E77C282DE6F496B684A605DCDAACEFC26641B7177A33EFF63589944A5951321768778AD0CDED22FC8A814352FE4FD953F0C000000000000000001AA3E0E38371A4F53CE30B61C9FE2D8E8CDC2E578509BFF5FDFFE72CD4B090FD75ED22BAE3DA059618EFA25EB036BD06E2540097920202493EC56408F20E648BFBB47EE996B784380CAE3E52FC32C7044F0459E4D3627DAEE2DEC1CC4351C00',
        );
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('04B1BCD281D9EBB5C5FC13190410514D9A279ED502A988E285622CCCD977B975');
        const aggregateBuilderSecond = transaction.builder;
        expect(aggregateBuilderSecond.transactions.length).deep.eq(1);
        expect(aggregateBuilderSecond.transactions[0]).deep.eq(SymbolTransactionUtils.toEmbedded(builder));
        expect(aggregateBuilderSecond.cosignatures.length).deep.eq(2);
        expect(aggregateBuilderSecond.cosignatures[0].signerPublicKey.serialize()).deep.eq(cosigner1.publicKey.toBytes());
        expect(aggregateBuilderSecond.cosignatures[1].signerPublicKey.serialize()).deep.eq(cosigner2.publicKey.toBytes());
        expect(transaction.size).eq(264 + 104 * 2);
    });

    it('Transaction to Aggregate, sign and add cosignatures 2 operations', () => {
        const transaction = factory.createAggregateComplete(deadline, fee.amount, [builder]);
        expect(transaction.isAggregate).eq(true);
        expect(transaction.size).eq(264);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '080100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF000001000000000001000000020000000100000000000000',
        );
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('879697DEA66ED22E3EC0136BD77352037BAEFC6DE56D1BA9B9B8A61F9E463BB2');
        transaction.sign(signer);
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('04B1BCD281D9EBB5C5FC13190410514D9A279ED502A988E285622CCCD977B975');
        transaction.addCosignatures([
            {
                signerPublicKey: cosigner1.publicKey.key,
                signature: cosigner1.sign(Converter.hexToUint8(Converter.uint8ToHex(transaction.transactionHash))),
            },
        ]);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '7001000000000000FEE908835B3B4DBDC46A52536FA01ADC6C563D3FAFB3F41CD6193CFAD14E011EE389B88707EA9BE79D07ECCF0FE02E8DF277E3E55F957A972C1FD1E463564105462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F300000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF00000100000000000100000002000000010000000000000000000000000000004164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68A9283775173B54FB75B47CCBD0EC7E77C282DE6F496B684A605DCDAACEFC26641B7177A33EFF63589944A5951321768778AD0CDED22FC8A814352FE4FD953F0C',
        );
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('04B1BCD281D9EBB5C5FC13190410514D9A279ED502A988E285622CCCD977B975');

        const aggregateBuilderFirst = transaction.builder;
        expect(aggregateBuilderFirst.transactions.length).deep.eq(1);
        expect(aggregateBuilderFirst.transactions[0]).deep.eq(SymbolTransactionUtils.toEmbedded(builder));
        expect(aggregateBuilderFirst.cosignatures.length).deep.eq(1);
        expect(aggregateBuilderFirst.cosignatures[0].signerPublicKey.serialize()).deep.eq(cosigner1.publicKey.toBytes());
        expect(transaction.size).eq(264 + 104 * 1);

        transaction.addCosignatures([
            {
                signerPublicKey: cosigner2.publicKey.key,
                signature: cosigner2.sign(Converter.hexToUint8(Converter.uint8ToHex(transaction.transactionHash))),
            },
        ]);
        expect(Converter.uint8ToHex(transaction.payload)).eq(
            'D801000000000000FEE908835B3B4DBDC46A52536FA01ADC6C563D3FAFB3F41CD6193CFAD14E011EE389B88707EA9BE79D07ECCF0FE02E8DF277E3E55F957A972C1FD1E463564105462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F300000000016841410A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF00000100000000000100000002000000010000000000000000000000000000004164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB68A9283775173B54FB75B47CCBD0EC7E77C282DE6F496B684A605DCDAACEFC26641B7177A33EFF63589944A5951321768778AD0CDED22FC8A814352FE4FD953F0C000000000000000001AA3E0E38371A4F53CE30B61C9FE2D8E8CDC2E578509BFF5FDFFE72CD4B090FD75ED22BAE3DA059618EFA25EB036BD06E2540097920202493EC56408F20E648BFBB47EE996B784380CAE3E52FC32C7044F0459E4D3627DAEE2DEC1CC4351C00',
        );
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('04B1BCD281D9EBB5C5FC13190410514D9A279ED502A988E285622CCCD977B975');
        const aggregateBuilderSecond = transaction.builder;
        expect(aggregateBuilderSecond.transactions.length).deep.eq(1);
        expect(aggregateBuilderSecond.transactions[0]).deep.eq(SymbolTransactionUtils.toEmbedded(builder));
        expect(aggregateBuilderSecond.cosignatures.length).deep.eq(2);
        expect(aggregateBuilderSecond.cosignatures[0].signerPublicKey.serialize()).deep.eq(cosigner1.publicKey.toBytes());
        expect(aggregateBuilderSecond.cosignatures[1].signerPublicKey.serialize()).deep.eq(cosigner2.publicKey.toBytes());
        expect(transaction.size).eq(264 + 104 * 2);
    });

    it('Transaction to Aggregate, signWithCosigners', () => {
        const transaction = factory.createAggregateBonded(deadline, fee.amount, [builder]);
        expect(transaction.isAggregate).eq(true);
        expect(transaction.size).eq(264);
        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('2CCE4B254E575D21BCAB344735F55888256A4542721848D8F5D141599BCB0485');

        expect(Converter.uint8ToHex(transaction.payload)).eq(
            '080100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016841420A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF000001000000000001000000020000000100000000000000',
        );
        transaction.signWithCosigners(signer, [cosigner1, cosigner2]);

        expect(Converter.uint8ToHex(transaction.payload)).eq(
            'D80100000000000079F1E6D3BEBD0F5F5AED204668949819A1A14B43AE70089F79D27BD81AB44B7918DA772DADDCF5E83B3A9D20356B1445BCFC3E28D95C8F86715B59A1B17ECC06462B2DF6B9D310A467CE8EBAFB1624E47152327E869DDBA0EBB6313AF1FA50F300000000016841420A0000000000000064000000000000006CACCBBF35736A9C198B816D0744AF851B1DC7B80318842EF0A2440D22A1F7B06000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000001685441681EA8552582BDC72DFE53EB4C791DF63994033CD21051DF00000100000000000100000002000000010000000000000000000000000000004164E826351CC1BE074A384729EAC54D5FDE53BAF48EFE8F431B675CD11ACB682D3ED34E68180AB62C42DC538C9644DE7C889B08FC9856822A2D9CCA11DE24DBCBE107A0AE706950E44CE0C2C2EE6084668597655911B3316183A2903D010B08000000000000000001AA3E0E38371A4F53CE30B61C9FE2D8E8CDC2E578509BFF5FDFFE72CD4B090F6D726E754687A4E054479FFD4290BD2201F26A92D4F2DD48285BEFC64867985B5FF001F6A27AB70549E177F58677952FB9B51694693336FFF75308DA8ACCE00A',
        );

        expect(Converter.uint8ToHex(transaction.transactionHash)).eq('FC67D196C44F82CBFF19E61828020D963E7D06068A54ACAE27D8DB5DA570BBAA');

        const aggregateBuilder = transaction.builder;
        expect(aggregateBuilder.transactions.length).deep.eq(1);
        expect(aggregateBuilder.transactions[0]).deep.eq(SymbolTransactionUtils.toEmbedded(builder));
        expect(aggregateBuilder.cosignatures.length).deep.eq(2);
        expect(aggregateBuilder.cosignatures[0].signerPublicKey.serialize()).deep.eq(cosigner1.publicKey.toBytes());
        expect(aggregateBuilder.cosignatures[1].signerPublicKey.serialize()).deep.eq(cosigner2.publicKey.toBytes());
        expect(transaction.size).eq(264 + 104 * 2);
    });
});
