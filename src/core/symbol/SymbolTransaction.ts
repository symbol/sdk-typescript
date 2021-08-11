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

import { Converter, Cosignature, Key, KeyPair, SymbolNetwork, SymbolTransactionUtils } from '@core';
import { AggregateTransactionBodyBuilder, TransactionBuilder, TransactionHelper } from 'catbuffer-typescript';

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
    private internalPayload: Uint8Array;
    /**
     * The catbuffer builder of a top level simpler or aggregate transaction. Always in sync with the serialized payload.
     *
     * This field changes when signing and cosigning the transaction.
     */
    private internalBuilder: T;

    /**
     * Internal constructor, please use the SymbolTransactionFactory
     * @param network - the network
     * @param builder - the builder, in-sync with the payload.
     * @param payload - the serialized payload, in-sync with builder.
     */
    public constructor(network: SymbolNetwork, builder: T, payload: Uint8Array) {
        SymbolTransactionUtils.validateBuilder(builder);
        this.generationHash = Converter.hexToUint8(network.generationHash);
        this.internalPayload = payload;
        this.internalBuilder = builder;
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
        return this.builder.type;
    }

    /**
     * @returns The builder of the top level transaction.
     */
    public get builder(): T {
        return this.internalBuilder;
    }

    /**
     * @returns the serialized top level transaction
     */
    public get payload(): Uint8Array {
        return this.internalPayload;
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
        this.internalPayload = newPayload;
        this.internalBuilder = TransactionHelper.loadFromBinary(newPayload) as T;
    }
}
