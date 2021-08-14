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

import { KeyPair, MerkleHashBuilder } from '@core';
import { Converter } from '@utils';
import * as allBuilders from 'catbuffer-typescript';
import {
    AggregateBondedTransactionBuilder,
    AggregateCompleteTransactionBuilder,
    AmountDto,
    EmbeddedTransactionBuilder,
    EmbeddedTransactionBuilderParams,
    EntityTypeDto,
    GeneratorUtils,
    KeyDto,
    NetworkTypeDto,
    Serializer,
    SignatureDto,
    TimestampDto,
    TransactionBuilder,
    TransactionBuilderParams,
    TransactionHelper,
} from 'catbuffer-typescript';

/**
 * Data required to attach a cosignature to an aggregate transaction.
 */
export interface Cosignature {
    version?: bigint;
    signerPublicKey: Uint8Array;
    signature: Uint8Array;
}

/**
 * Information of a transaction after being signed.
 */
export interface SignedTransaction {
    payload: Uint8Array;
    signature: Uint8Array;
    transactionHash: Uint8Array;
}

/**
 * Params required to convert a transaction body builder into a top level transaction builder
 */
export interface CreateFromBodyParams extends Partial<TransactionBuilderParams> {
    fee: AmountDto;
    deadline: TimestampDto;
    network: NetworkTypeDto;
    bodyBuilder: Serializer;
}

/**
 * Params required to convert a transaction body builder into a top embedded transaction builder
 */
export interface CreateEmbeddedFromBodyParams extends Partial<EmbeddedTransactionBuilderParams> {
    network: NetworkTypeDto;
    bodyBuilder: Serializer;
}

/**
 * A stateless helper class for low-level transaction related operations.
 *
 * Devs wouldn't use this class directly, they should use the SymbolTransaction wrapper.
 */
export class SymbolTransactionUtils {
    /**
     * The default cosignature version.
     */
    public static readonly COSIGNATURE_VERSION: bigint = BigInt(0);
    /**
     * Transaction header size
     *
     * Included fields are `size`, `verifiableEntityHeader_Reserved1`,
     * `signature`, `signerPublicKey` and `entityBody_Reserved1`.
     *
     */
    public static readonly Header_Size: number = 8 + 64 + 32 + 4;

    /**
     * Index of the transaction *body*
     *
     * Included fields are the transaction header, `version`,
     * `network`, `type`, `maxFee` and `deadline`
     *
     */
    public static readonly Body_Index: number = SymbolTransactionUtils.Header_Size + 1 + 1 + 2 + 8 + 8;

    /**
     * Index of the transaction *type*
     *
     * Included fields are the transaction header, `version`
     * and `network`
     *
     */
    public static readonly Type_Index: number = SymbolTransactionUtils.Header_Size + 2;

    /**
     * The known aggregate types.
     */
    public static readonly AGGREGATE_TYPES = [EntityTypeDto.AGGREGATE_BONDED_TRANSACTION, EntityTypeDto.AGGREGATE_COMPLETE_TRANSACTION];

    /**
     * It calculates the transaction hash from the serialized transaction. Transaction hashes are used to identify a transaction in a network.
     *
     * @param transactionPayload - the transaction payload, most likely serialized using the catbuffer builders.
     * @param generationHash - the network's generation hash.
     * @returns the hash of the transaction that can be used to identify it in a symbol blockchain.
     */
    public static calculateTransactionHash(transactionPayload: Uint8Array, generationHash: Uint8Array): Uint8Array {
        const transactionBody = this.getTransactionBody(transactionPayload);
        const signature = transactionPayload.slice(8, 8 + 64);
        const publicKey = transactionPayload.slice(8 + 64, 8 + 64 + 32);
        // layout: `signature_R || signerPublicKey || generationHash || EntityDataBuffer`
        return Converter.hash(signature, publicKey, generationHash, transactionBody);
    }

    /**
     * Returns the body of the transaction, generally used for the transaction hash and as part of the signing data.
     *
     * @param transactionPayload - the transaction payload
     */
    private static getTransactionBody(transactionPayload: Uint8Array): Uint8Array {
        const isAggregateTransaction = this.isAggregate(transactionPayload);
        return isAggregateTransaction
            ? transactionPayload.slice(SymbolTransactionUtils.Header_Size, SymbolTransactionUtils.Body_Index + 32)
            : transactionPayload.slice(SymbolTransactionUtils.Header_Size);
    }

    /**
     * Returns if the transaction of the payload is an aggregate transaction. In some situations, aggregate are treated differently.
     *
     * @param transactionPayload - the transaction payload
     */
    public static isAggregate(transactionPayload: Uint8Array): boolean {
        const entityType = this.getTransactionType(transactionPayload);
        return this.AGGREGATE_TYPES.includes(entityType);
    }

    /**
     * Resolves the transaction type from the transaction payload.
     *
     * @param transactionPayload - the transaction payload.
     */
    public static getTransactionType(transactionPayload: Uint8Array): number {
        const typeIdx: number = SymbolTransactionUtils.Type_Index;
        return GeneratorUtils.bufferToUint16(transactionPayload.slice(typeIdx, typeIdx + 2));
    }

    /**
     * Perform the signing of a transaction returning the new signed payload, signature and the new transaction hash.
     *
     * @param signer - the key pair used to sign the transaction
     * @param transactionPayload - the original unsigned transaction.
     * @param generationHash - the generation that is part of the signing data.
     */
    public static sign(signer: KeyPair, transactionPayload: Uint8Array, generationHash: Uint8Array): SignedTransaction {
        // 1. prepare the data of the transaction
        const signingBytes = this.getSigningData(generationHash, transactionPayload);
        // 2. sign the data of the transaction
        const signature = signer.sign(signingBytes);
        // 3. prepare the (signed) payload.
        const signedPayload = this.addSignature(transactionPayload, signature, signer.publicKey.toBytes());
        return {
            signature,
            payload: signedPayload,
            transactionHash: SymbolTransactionUtils.calculateTransactionHash(signedPayload, generationHash),
        };
    }

    /**
     * Adds the signature and signed key to an unsigned payload by swapping the signature and signer public key contents. The original payload is not changed.
     *
     * @param serializedTransaction - the unsigned transaction payload.
     * @param signature - the signature to inject
     * @param publicKey - the signer public key to inject.
     */
    public static addSignature(serializedTransaction: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Uint8Array {
        return Converter.concat(
            serializedTransaction.slice(0, 8),
            signature,
            publicKey,
            new Uint8Array(4),
            serializedTransaction.slice(SymbolTransactionUtils.Header_Size),
        );
    }

    /**
     * Returns the signing data of a transaction. Both the body of the transaction and the network generation hash are part of the signing data.
     *
     * This data + the signer public key will be used to generate the signature.
     *
     * @param generationHash - the generation hash
     * @param transactionPayload - the transaction payload
     */
    public static getSigningData(generationHash: Uint8Array, transactionPayload: Uint8Array): Uint8Array {
        return Converter.concat(generationHash, this.getTransactionBody(transactionPayload));
    }

    /**
     * It generates the transactions hash of the aggregate's inner transactions.
     *
     * @param transactionPayload - the payload, it needs to be an aggregate bonded or complete transaction
     */
    public static calculateAggregateTransactionsHash(transactionPayload: Uint8Array): Uint8Array {
        if (!this.isAggregate(transactionPayload)) {
            throw new Error('Cannot calculate transactions hash of simple transaction.');
        }
        const transaction = TransactionHelper.loadFromBinary(transactionPayload) as
            | AggregateCompleteTransactionBuilder
            | AggregateBondedTransactionBuilder;
        return this.calculateAggregateTransactionsHashFromPayloads(transaction.transactions.map((t) => t.serialize()));
    }

    /**
     * It generates the transactions hash given the inner transaction of an aggregate.
     *
     * @param transactions - the inner transactions.
     */
    public static calculateAggregateTransactionsHashFromPayloads(transactions: Uint8Array[]): Uint8Array {
        const builder = new MerkleHashBuilder();
        transactions.forEach((transaction) => {
            const padding = new Uint8Array(GeneratorUtils.getPaddingSize(transaction.length, 8));
            builder.update(Converter.hash(Converter.concat(transaction, padding)));
        });
        return builder.final();
    }

    /**
     * It signs and cosign an aggregate transaction using the provider signer and cosigners.
     *
     * The original payload is not changed, the returned payload will have all signatures and cosignatures.
     *
     * @param signer - the aggregate transaction signer
     * @param transactionPayload - the unsigned aggregate transaction payload
     * @param generationHash - the generation hash.
     * @param cosigners - the cosigners
     */
    public static signWithCosigners(
        signer: KeyPair,
        transactionPayload: Uint8Array,
        generationHash: Uint8Array,
        cosigners: KeyPair[],
    ): SignedTransaction {
        if (!this.isAggregate(transactionPayload)) {
            throw new Error('Cannot sign and cosign a simple transaction.');
        }
        const signedTransaction = this.sign(signer, transactionPayload, generationHash);
        const cosignedTransaction = this.cosign(signedTransaction.payload, generationHash, cosigners);
        return {
            signature: signedTransaction.signature,
            payload: cosignedTransaction.payload,
            transactionHash: signedTransaction.transactionHash,
        };
    }

    /**
     * Cosigns the already signed transaction returning the new co-signed paylaod.
     * @param transactionPayload - the transaction signed by the initiator.
     * @param generationHash - the generation hash.
     * @param cosigners - the cosigners to cosign the transaction.
     * @param version - the version of the cosignatures, SymbolTransactionUtils.COSIGNATURE_VERSION is resolved by defrault.
     */
    public static cosign(
        transactionPayload: Uint8Array,
        generationHash: Uint8Array,
        cosigners: KeyPair[],
        version?: bigint,
    ): {
        payload: Uint8Array;
        transactionHash: Uint8Array;
    } {
        const transactionHash = this.calculateTransactionHash(transactionPayload, generationHash);
        const cosignatures = cosigners.map((cosigner) => ({
            version: version,
            signature: cosigner.sign(transactionHash),
            signerPublicKey: cosigner.publicKey.toBytes(),
        }));
        const payload = this.addCosignatures(transactionPayload, cosignatures);
        return {
            payload,
            transactionHash,
        };
    }

    /**
     * It adds the cosignatures to a given signed aggregate transaction.
     *
     * @param originalPayload - the original payload, at least signed by the initiator.
     * @param cosignatures - the cosignatures
     */
    public static addCosignatures(originalPayload: Uint8Array, cosignatures: Cosignature[]): Uint8Array {
        if (!this.isAggregate(originalPayload)) {
            throw new Error('Cannot add cosignatures to a simple transaction.');
        }
        const newCosignatures = Converter.concat(
            ...cosignatures.map((cosignature) => {
                return Converter.concat(
                    GeneratorUtils.bigIntToBuffer(cosignature.version || SymbolTransactionUtils.COSIGNATURE_VERSION),
                    cosignature.signerPublicKey,
                    cosignature.signature,
                );
            }),
        );
        return Converter.concat(
            GeneratorUtils.uint32ToBuffer(originalPayload.length + newCosignatures.length),
            originalPayload.slice(4),
            newCosignatures,
        );
    }

    /**
     * Converts a concrete transaction builder to the embedded builder to be used in aggregate transactions.
     * @param builder - the builder
     */
    public static toEmbedded(builder: Serializer): EmbeddedTransactionBuilder {
        const builderName = this.validateBuilder(builder);
        if (builderName.startsWith('Embedded')) {
            return builder as EmbeddedTransactionBuilder;
        }
        const embeddedBuilderName = 'Embedded' + builderName;
        const embeddedBuilder = allBuilders[embeddedBuilderName];
        if (!embeddedBuilder) {
            throw new Error(`Cannot resolve embedded transaction builder from ${builderName}.`);
        }
        return new embeddedBuilder(builder);
    }

    /**
     * It validates that a builder is a concrete transaction builder, either top level or embedded.
     * @param builder - the builder
     */
    public static validateBuilder(builder: Serializer): string {
        const builderName = builder.constructor.name;
        if (!builderName.endsWith('TransactionBuilder')) {
            throw new Error(`Builder ${builderName} is not a transaction builder.`);
        }
        if (builderName == 'TransactionBuilder') {
            throw new Error(`Builder ${builderName} is not a concrete transaction builder.`);
        }
        if (builderName == 'EmbeddedTransactionBuilder') {
            throw new Error(`Builder ${builderName} is not a concrete transaction builder.`);
        }
        return builderName;
    }

    /**
     * It validates if the provided builder is a body builder.
     * @param bodyBuilder - the builder.
     */
    public static validateBodyBuilder(bodyBuilder: Serializer): string {
        const bodyBuilderName = bodyBuilder.constructor.name;
        if (!bodyBuilderName.endsWith('TransactionBodyBuilder')) {
            throw new Error(`Builder ${bodyBuilderName} is not a transaction builder.`);
        }
        return bodyBuilderName;
    }

    public static createFromBodyBuilder(params: CreateFromBodyParams): TransactionBuilder {
        const builder = this.getBuilder(params);
        return new builder({
            signerPublicKey: params.signerPublicKey || KeyDto.createEmpty(),
            signature: params.signature || SignatureDto.createEmpty(),
            fee: params.fee,
            network: params.network,
            deadline: params.deadline,
            version: params.version || builder.VERSION,
            type: params.type || builder.ENTITY_TYPE,
            ...params.bodyBuilder,
        });
    }

    public static createEmbeddedFromBodyBuilder(params: CreateEmbeddedFromBodyParams): EmbeddedTransactionBuilder {
        const embeddedBuilderName = 'Embedded' + this.validateBodyBuilder(params.bodyBuilder).replace('Body', '');
        const embeddedBuilder = allBuilders[embeddedBuilderName];
        if (!embeddedBuilder) {
            throw new Error(`Cannot resolve embedded transaction builder from ${embeddedBuilderName}.`);
        }
        return new embeddedBuilder({
            signerPublicKey: params.signerPublicKey || KeyDto.createEmpty(),
            network: params.network,
            version: params.version || embeddedBuilder.VERSION,
            type: params.type || embeddedBuilder.ENTITY_TYPE,
            ...params.bodyBuilder,
        });
    }

    private static getBuilder(params: CreateFromBodyParams) {
        if (params.type == EntityTypeDto.AGGREGATE_BONDED_TRANSACTION) {
            return AggregateBondedTransactionBuilder;
        }
        if (params.type == EntityTypeDto.AGGREGATE_COMPLETE_TRANSACTION) {
            return AggregateCompleteTransactionBuilder;
        }
        const builderName = this.validateBodyBuilder(params.bodyBuilder).replace('Body', '');
        const builder = allBuilders[builderName];
        if (!builder) {
            throw new Error(`Cannot resolve Transaction Builder from ${builderName}.`);
        }
        return builder;
    }
}
