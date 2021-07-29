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

import {
    Converter,
    Cosignature,
    Key,
    KeyPair,
    SymbolAddress,
    SymbolDeadline,
    SymbolIdGenerator,
    SymbolNetwork,
    SymbolTransactionUtils,
} from '@core';
import {
    AggregateTransactionBodyBuilder,
    AmountDto,
    EmbeddedTransactionBuilder,
    EntityTypeDto,
    Hash256Dto,
    KeyDto,
    Serializer,
    TimestampDto,
    TransactionBuilder,
    TransactionHelper,
} from 'catbuffer-typescript';

/**
 * An unresolved address is when either address or an alias of the address (aka namespaceId) is provided
 */
export type SymbolUnresolvedAddress = bigint | SymbolAddress;

/**
 * Factory class to create SymbolTransaction objects from low level builders.
 */
export class SymbolTransactionFactory {
    /**
     * @param network - the network used when network type and generation hash are required.
     */
    constructor(private readonly network: SymbolNetwork) {}

    /**
     * It creates a top level transaction from a body builder, eg: catapult's TransferTransactionBuilder.
     *
     * @param deadline - the deadline
     * @param fee - the fee
     * @param bodyBuilder - the body builder, eg: catapult's TransferTransactionBuilder.
     */
    public create(deadline: SymbolDeadline, fee: bigint, bodyBuilder: Serializer): SymbolTransaction {
        const builder = SymbolTransactionUtils.createFromBodyBuilder({
            fee: new AmountDto(fee),
            deadline: new TimestampDto(BigInt(deadline.adjustedValue)),
            network: this.network.identifier,
            bodyBuilder: bodyBuilder,
        });
        return this.createFromBuilder(builder);
    }

    /**
     * It creates an aggregate complete transaction.
     *
     * @param deadline - the deadline
     * @param fee - the fee
     * @param builders - a list of subclasses ofs EmbeddedTransactionBuilder
     */
    public createAggregateComplete(deadline: SymbolDeadline, fee: bigint, builders: EmbeddedTransactionBuilder[]): SymbolTransaction {
        return this.createAggregate(EntityTypeDto.AGGREGATE_COMPLETE_TRANSACTION, deadline, fee, builders);
    }
    /**
     * It creates an aggregate bonded transaction.
     *
     * @param deadline - the deadline
     * @param fee - the fee
     * @param builders - a list of subclasses ofs EmbeddedTransactionBuilder
     */
    public createAggregateBonded(deadline: SymbolDeadline, fee: bigint, builders: EmbeddedTransactionBuilder[]): SymbolTransaction {
        return this.createAggregate(EntityTypeDto.AGGREGATE_BONDED_TRANSACTION, deadline, fee, builders);
    }
    /**
     * It creates an aggregate transaction.
     *
     * @param type - the aggregate type, bonded or complete.
     * @param deadline - the deadline
     * @param fee - the fee
     * @param builders - a list of subclasses ofs EmbeddedTransactionBuilder
     */
    public createAggregate(
        type: EntityTypeDto.AGGREGATE_COMPLETE_TRANSACTION | EntityTypeDto.AGGREGATE_BONDED_TRANSACTION,
        deadline: SymbolDeadline,
        fee: bigint,
        builders: EmbeddedTransactionBuilder[],
    ): SymbolTransaction {
        const embeddedBuilders = builders.map((b) => SymbolTransactionUtils.toEmbedded(b));

        const bodyBuilder = new AggregateTransactionBodyBuilder({
            transactionsHash: new Hash256Dto(this.calculateAggregateTransactionsHashFromPayloads(embeddedBuilders)),
            transactions: embeddedBuilders,
            cosignatures: [],
        });
        const builder = SymbolTransactionUtils.createFromBodyBuilder({
            fee: new AmountDto(fee),
            deadline: new TimestampDto(BigInt(deadline.adjustedValue)),
            type: type,
            network: this.network.identifier,
            bodyBuilder: bodyBuilder,
        });
        return this.createFromBuilder(builder);
    }

    /**
     * It converts an Body Builder (e.g: TransferTransactionBodyBuilder) to an Embedded Builder (e.g: EmbeddedTransferTransactionBuilder)to be used in an aggregate transaction
     * @param bodyBuilder - the body builder
     * @param signerPublicKey - the signer public key.
     */
    public toEmbedded(bodyBuilder: Serializer, signerPublicKey: Key): EmbeddedTransactionBuilder {
        return SymbolTransactionUtils.createEmbeddedFromBodyBuilder({
            network: this.network.identifier,
            signerPublicKey: new KeyDto(signerPublicKey.key),
            bodyBuilder: bodyBuilder,
        });
    }

    /**
     * Helper method that serializes an unresolved address to be used in Catbuffer builders.
     * @param unresolvedAddressId - the unresolved address to serialize.
     */
    public toUnresolvedAddress(unresolvedAddressId: SymbolUnresolvedAddress): Uint8Array {
        if (typeof unresolvedAddressId == 'bigint') {
            return SymbolIdGenerator.encodeUnresolvedAddress(this.network.identifier, unresolvedAddressId);
        } else {
            return unresolvedAddressId.getAddressBytes();
        }
    }

    /**
     * Generic method to create transaction from a top level (simple or aggregate) builder.
     * @param builder - the builder
     */
    public createFromBuilder<T extends TransactionBuilder>(builder: T): SymbolTransaction<T> {
        return SymbolTransaction.createFromBuilder(this.network, builder);
    }

    /**
     * Generic method to create transaction from a top level (simple or aggregate) payload.
     *
     * @param payload - the serialized payload.
     */
    public createFromPayload(payload: Uint8Array): SymbolTransaction {
        return SymbolTransaction.createFromPayload(this.network, payload);
    }

    /**
     * Hides how transactions hash is generated from the provided embedded transactions. Dev doesn't need to calculate at front.
     * @param embeddedBuilders - the builders of the embedded transactions.
     */
    private calculateAggregateTransactionsHashFromPayloads(embeddedBuilders: EmbeddedTransactionBuilder[]): Uint8Array {
        return SymbolTransactionUtils.calculateAggregateTransactionsHashFromPayloads(embeddedBuilders.map((b) => b.serialize()));
    }
}

/**
 * The mutable generic symbol transaction that wraps the signing over catbuffer builders.
 */
export class SymbolTransaction<T extends TransactionBuilder = TransactionBuilder> {
    /**
     * The network generation hash used for resolve the transaction hash and the signing data of the transaction.
     */
    private readonly generationHash: Uint8Array;

    /**
     * The serialized payload of a top level simpler or aggregate transaction. Always in sync with the catbuffer builder.
     *
     * This field changes when signing and cosigning the transaction.
     *
     */
    private _payload: Uint8Array;
    /**
     * The catbuffer builder of a top level simpler or aggregate transaction. Always in sync with the serialized payload.
     *
     * This field changes when signing and cosigning the transaction.
     */
    private _builder: T;

    /**
     * Internal constructor, please use the SymbolTransactionFactory
     * @param network - the network
     * @param builder - the builder, in-sync with the payload.
     * @param payload - the serialized payload, in-sync with builder.
     */
    public constructor(network: SymbolNetwork, builder: T, payload: Uint8Array) {
        SymbolTransactionUtils.validateBuilder(builder);
        this.generationHash = Converter.hexToUint8(network.generationHash);
        this._payload = payload;
        this._builder = builder;
    }

    /**
     * It creates a transaction from the known payload.
     * @param network - the network payload
     * @param payload - the serialized payload, top level simple or aggregate transaction.
     */
    public static createFromPayload(network: SymbolNetwork, payload: Uint8Array): SymbolTransaction {
        return new SymbolTransaction(network, TransactionHelper.loadFromBinary(payload), payload);
    }
    /**
     * It creates a transaction from the builder.
     * @param network - the network payload
     * @param builder - the simple or aggregate top level transaction builder.
     */
    public static createFromBuilder<T extends TransactionBuilder>(network: SymbolNetwork, builder: T): SymbolTransaction<T> {
        return new SymbolTransaction(network, builder, builder.serialize());
    }

    /**
     * @returns the transaction type of this transaction.
     */
    public get transactionType(): number {
        return this._builder.type;
    }

    /**
     * @returns The builder of the top level transaction.
     */
    public get builder(): T {
        return this._builder;
    }

    /**
     * @returns the serialized top level transaction
     */
    public get payload(): Uint8Array {
        return this._payload;
    }

    /**
     * @returns the size of the transaction.
     */
    public get size(): number {
        return this.builder.size;
    }
    /**
     * @returns the subarray of the paylaod that it needs to be signed by the transaction signer. For information only.
     */
    public get signingData(): Uint8Array {
        return SymbolTransactionUtils.getSigningData(this.generationHash, this.payload);
    }

    /**
     * @returns the signer public key.
     */
    public get signerPublicKey(): Key {
        return new Key(this.builder.signerPublicKey.key);
    }

    /**
     * @returns the transaction hash of the transaction that identifies the transaction in the network.
     */
    public get transactionHash(): Uint8Array {
        return SymbolTransactionUtils.calculateTransactionHash(this.payload, this.generationHash);
    }

    /**
     * @returns if this transaction is aggregate. Aggregate transactions allows extra operations like cosigning or adding cosignatures.
     */
    public get isAggregate(): boolean {
        return SymbolTransactionUtils.AGGREGATE_TYPES.includes(this.transactionType);
    }

    /**
     * It signs this transaction using the provided key.
     *
     * The builder, signature, signerPublicKey, hash, and payload change after this operation.
     *
     * @param signer - the signer key pair
     */
    public sign(signer: KeyPair): void {
        if (this.cosignatures.length) {
            throw new Error('Cannot re-sign when there are cosignatures. Cosignatures will be invalid!');
        }
        const signedTransaction = SymbolTransactionUtils.sign(signer, this.payload, this.generationHash);
        this.updateBuilder(signedTransaction.payload);
    }
    /**
     * It signs and cosigns the aggregate transaction using the provided keys.
     *
     * The builder, signature, cosignatures, signerPublicKey, hash, size, and payload change after this operation.
     *
     * @param signer - the signer key pair
     * @param cosigners - the cosigners' key pairs
     */
    public signWithCosigners(signer: KeyPair, cosigners: KeyPair[]): void {
        if (this.cosignatures.length) {
            throw new Error('Cannot re-sign when there are cosignatures. Cosignatures will be invalid!');
        }
        const signedTransaction = SymbolTransactionUtils.signWithCosigners(signer, this.payload, this.generationHash, cosigners);
        this.updateBuilder(signedTransaction.payload);
    }

    /**
     * It cosigns the aggregate transaction using the provided keys.
     *
     * The builder, cosignatures, size, and payload change after this operation.
     *
     * @param cosigners - the cosigners' key pairs
     */
    public cosign(cosigners: KeyPair[]): void {
        const signedTransaction = SymbolTransactionUtils.cosign(this.payload, this.generationHash, cosigners);
        this.updateBuilder(signedTransaction.payload);
    }

    /**
     * It adds cosignatures to the aggregate transaction.
     *
     * Useful when the signing is done elsewhere.
     *
     * @param cosignatures - the cosignatures
     */
    public addCosignatures(cosignatures: Cosignature[]): void {
        this.updateBuilder(SymbolTransactionUtils.addCosignatures(this.payload, cosignatures));
    }

    /**
     * @returns the transactions cosignatures if the transaction is aggregate.
     */
    public get cosignatures(): Cosignature[] {
        if (!this.isAggregate) {
            return [];
        }
        return (this.builder.body as AggregateTransactionBodyBuilder).cosignatures.map((builder) => ({
            signature: builder.signature.signature,
            signerPublicKey: builder.signerPublicKey.key,
            version: builder.version,
        }));
    }

    /**
     * This method mutates the object setting up the new serialized payload and builder.
     * @param newPayload - the new payload
     */
    private updateBuilder(newPayload: Uint8Array) {
        this._payload = newPayload;
        this._builder = TransactionHelper.loadFromBinary(newPayload) as T;
    }
}
