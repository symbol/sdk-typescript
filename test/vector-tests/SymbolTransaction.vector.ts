import { Key, KeyPair, SymbolKeyPair, SymbolTransactionUtils } from '@core';
import { Converter } from '@utils';
import { TransactionHelper } from 'catbuffer-typescript';
import { expect } from 'chai';
import { VectorTester } from './VectorTester';

export interface TransactionVectorItem {
    payload: string;
    generationHash: string;
    transactionHash: string;
    transactionType: number;
    signature: string;
    signerPublicKey: string;
}

const tester = new VectorTester(false);

describe('transaction hash - test vector', () => {
    tester.run<TransactionVectorItem>('test-transaction.json', (item) => {
        const generationHash = Converter.hexToUint8(item.generationHash);
        const payload = Converter.hexToUint8(item.payload);

        // Act + Assert:
        expect(Converter.uint8ToHex(SymbolTransactionUtils.calculateTransactionHash(payload, generationHash))).equal(item.transactionHash);
        expect(SymbolTransactionUtils.getTransactionType(payload)).equal(item.transactionType);
    });
});

describe('transaction builders - test vector', () => {
    tester.run<TransactionVectorItem>('test-transaction.json', (item) => {
        const payload = Converter.hexToUint8(item.payload);
        const builder = TransactionHelper.loadFromBinary(payload);

        // Act + Assert:
        expect(builder.type).equal(item.transactionType);
        expect(Converter.uint8ToHex(builder.signature.signature)).equal(item.signature);
        expect(Converter.uint8ToHex(builder.signerPublicKey.key)).equal(item.signerPublicKey);
        expect(builder.type.valueOf()).equal(item.transactionType);
    });
});

export interface TransactionsHashVectorItem {
    transactionPayloads: string[];
    transactionsHash: string;
}

describe('aggregate transactions hash - test vector', () => {
    tester.run<TransactionsHashVectorItem>('test-transactions-hash.json', (item) => {
        // Act + Assert:
        const transactionsHash = SymbolTransactionUtils.calculateAggregateTransactionsHashFromPayloads(
            item.transactionPayloads.map((p) => Converter.hexToUint8(p)),
        );
        expect(Converter.uint8ToHex(transactionsHash)).equal(item.transactionsHash);
    });
});

export interface TransactionSignatureVectorItem {
    payload: string;
    generationHash: string;
    transactionHash: string;
    transactionType: number;
    signingData: string;
    signature: string;
    signedTransactionHash: string;
    signerPublicKey: string;
    signerPrivateKey: string;
    signedPayload: string;
}

describe('transaction signatures - test vector', () => {
    tester.run<TransactionSignatureVectorItem>('test-transaction-signature.json', (item) => {
        const generationHash = Converter.hexToUint8(item.generationHash);
        const payload = Converter.hexToUint8(item.payload);
        const keyPair = new SymbolKeyPair(Key.createFromHex(item.signerPrivateKey));

        // Act + Assert:
        // data to be signed
        const signingData = Converter.uint8ToHex(SymbolTransactionUtils.getSigningData(generationHash, payload));
        // original payload transaction hash
        const transactionHash = Converter.uint8ToHex(SymbolTransactionUtils.calculateTransactionHash(payload, generationHash));
        // signed transaction
        const signedTransaction = SymbolTransactionUtils.sign(keyPair, payload, generationHash);

        // Signing same data

        expect(signingData).equal(item.signingData);

        //Key Pair is fine
        expect(keyPair.publicKey.toString()).equal(item.signerPublicKey);
        expect(keyPair.privateKey.toString()).equal(item.signerPrivateKey);

        // Transaction type is the same.
        expect(SymbolTransactionUtils.getTransactionType(payload)).equal(item.transactionType);

        // Hash before signing is fine
        expect(transactionHash).equal(item.transactionHash);

        //Signature is fine
        expect(keyPair.verify(Converter.hexToUint8(item.signingData), Converter.hexToUint8(item.signature))).equal(true);
        expect(Converter.uint8ToHex(signedTransaction.signature)).equal(item.signature);

        //Signer public key and signature included in the signed payloads (vector and generated)
        expect(item.signedPayload.indexOf(item.signerPublicKey)).equal(144);
        expect(Converter.uint8ToHex(signedTransaction.payload).indexOf(item.signerPublicKey)).equal(144);

        expect(item.signedPayload.indexOf(item.signature)).equal(16);
        expect(Converter.uint8ToHex(signedTransaction.payload).indexOf(item.signature)).equal(16);

        //Signed payloads create the same builder objets.
        expect(TransactionHelper.loadFromBinary(signedTransaction.payload)).deep.equal(
            TransactionHelper.loadFromBinary(Converter.hexToUint8(item.signedPayload)),
        );

        // Same signed payload!!
        expect(Converter.uint8ToHex(signedTransaction.payload)).eq(item.signedPayload);

        // Same transaction hash after transaction is signed
        expect(Converter.uint8ToHex(signedTransaction.transactionHash)).equal(item.signedTransactionHash);
    });
});

export interface TransactionCosignatureVectorItem {
    payload: string;
    generationHash: string;
    transactionHash: string;
    transactionType: number;
    signedTransactionHash: string;
    signerPublicKey: string;
    signerPrivateKey: string;
    signedPayload: string;
    transactionsHash: string;
    cosignatories: [
        {
            publicKey: string;
            privateKey: string;
        },
    ];
}

describe('transaction cosignatures - test vector', () => {
    tester.run<TransactionCosignatureVectorItem>('test-transaction-cosignatures.json', (item) => {
        const generationHash = Converter.hexToUint8(item.generationHash);
        const payload = Converter.hexToUint8(item.payload);
        const keyPair = new SymbolKeyPair(Key.createFromHex(item.signerPrivateKey));

        // Act + Assert:
        const transactionHash = SymbolTransactionUtils.calculateTransactionHash(payload, generationHash);
        expect(Converter.uint8ToHex(SymbolTransactionUtils.calculateAggregateTransactionsHash(payload))).equal(item.transactionsHash);
        expect(Converter.uint8ToHex(transactionHash)).equal(item.transactionHash);

        function basicTest(cosigners: KeyPair[], expectedPayload?: string) {
            const signedTransaction = SymbolTransactionUtils.signWithCosigners(keyPair, payload, generationHash, cosigners);

            //Key Pair is fine
            expect(keyPair.publicKey.toString()).equal(item.signerPublicKey);
            expect(keyPair.privateKey.toString()).equal(item.signerPrivateKey);

            // Transaction type is the same.
            expect(SymbolTransactionUtils.getTransactionType(payload)).equal(item.transactionType);

            // Transaction hash is also fine.
            expect(Converter.uint8ToHex(transactionHash)).equal(item.transactionHash);

            //Signer public key and signature included in the signed payloads (vector and generated)
            expect(item.signedPayload.indexOf(item.signerPublicKey)).equal(144);
            const signedPayloadHex = Converter.uint8ToHex(signedTransaction.payload);
            expect(signedPayloadHex.indexOf(item.signerPublicKey)).equal(144);

            cosigners.forEach((c) => {
                expect(signedPayloadHex.indexOf(Converter.uint8ToHex(c.publicKey.toBytes()))).gt(-1);
                const cosignature = c.sign(signedTransaction.transactionHash);
                expect(signedPayloadHex.indexOf(Converter.uint8ToHex(cosignature))).gt(-1);
            });

            // Same signed payload!!
            if (expectedPayload) expect(signedPayloadHex).eq(expectedPayload);

            // Same transaction hash after transaction is signed
            expect(Converter.uint8ToHex(signedTransaction.transactionHash)).equal(item.signedTransactionHash);
        }
        const allCosigners = item.cosignatories.map((pair) => new SymbolKeyPair(Key.createFromHex(pair.privateKey)));
        basicTest(allCosigners, item.signedPayload.toUpperCase());
        basicTest([]);
    });
});
