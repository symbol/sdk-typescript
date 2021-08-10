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
    AggregateBondedTransactionBuilder,
    AggregateCompleteTransactionBuilder,
    AggregateTransactionBodyBuilder,
    AmountDto,
    EmbeddedTransactionBuilder,
    EntityTypeDto,
    Hash256Dto,
    KeyDto,
    Serializer,
    TimestampDto,
    TransactionBuilder,
} from 'catbuffer-typescript';
import { Key } from '../Key';
import { SymbolAddress } from './SymbolAddress';
import { SymbolDeadline } from './SymbolDeadline';
import { SymbolIdGenerator } from './SymbolIdGenerator';
import { SymbolNetwork } from './SymbolNetwork';
import { SymbolTransaction } from './SymbolTransaction';
import { SymbolTransactionUtils } from './SymbolTransactionUtils';

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
    public createAggregateComplete(
        deadline: SymbolDeadline,
        fee: bigint,
        builders: EmbeddedTransactionBuilder[],
    ): SymbolTransaction<AggregateCompleteTransactionBuilder> {
        return this.createAggregate(
            EntityTypeDto.AGGREGATE_COMPLETE_TRANSACTION,
            deadline,
            fee,
            builders,
        ) as SymbolTransaction<AggregateCompleteTransactionBuilder>;
    }

    /**
     * It creates an aggregate bonded transaction.
     *
     * @param deadline - the deadline
     * @param fee - the fee
     * @param builders - a list of subclasses ofs EmbeddedTransactionBuilder
     */
    public createAggregateBonded(
        deadline: SymbolDeadline,
        fee: bigint,
        builders: EmbeddedTransactionBuilder[],
    ): SymbolTransaction<AggregateBondedTransactionBuilder> {
        return this.createAggregate(
            EntityTypeDto.AGGREGATE_BONDED_TRANSACTION,
            deadline,
            fee,
            builders,
        ) as SymbolTransaction<AggregateBondedTransactionBuilder>;
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
     * The namespace id based on the full alias name.
     *
     * It hides the SymbolIdGenerator implementation.
     *
     * @param fullName - the full namespace
     */
    public fullNameToNamespaceId(fullName: string): bigint {
        const path = SymbolIdGenerator.generateNamespacePath(fullName);
        return path[path.length - 1];
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
        return SymbolTransactionUtils.calculateAggregateTransactionsHashFromPayloads(
            embeddedBuilders.map((embeddedBuilder) => embeddedBuilder.serialize()),
        );
    }
}
