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

import { Deadline, Network, Nis1KeyPair, Nis1TransactionType } from '@core';
import { Duration, Instant } from '@js-joda/core';
import { toBufferLE } from 'bigint-buffer';
import { Key } from '../Key';
import { Converter } from '../utils/Converter';
import { Serializer } from './transactions/Serializer';

/**
 * Generic Nis1 transaction class
 */
export class Nis1Transaction<T extends Serializer> {
    /**
     * Transaction version
     */
    public version: number;

    /**
     * Transaction payload (internal)
     */
    private internalPayload: Uint8Array;

    /**
     * Constructor
     * @param network - Nis1 network
     * @param deadline - Transaction deadline
     * @param signerPublicKey - Signer's public key
     * @param body - Transaction body
     */
    constructor(public readonly network: Network, public readonly deadline: Deadline, public signerPublicKey: Key, public body: T) {
        this.version = (this.network.identifier << 24) + 1;
        this.internalPayload = this.serialize();
    }

    /**
     * Property: transaction timestamp
     */
    public get timestamp(): number {
        return Math.max(0, Instant.ofEpochSecond(this.deadline.adjustedValue).minusSeconds(Duration.ofHours(24).seconds()).epochSecond());
    }

    /**
     * Property: transaction type
     */
    public get type(): Nis1TransactionType {
        return this.body.type;
    }

    /**
     * Property: Transaction payload
     */
    public get payload(): Uint8Array {
        return this.internalPayload;
    }

    /**
     * Property: Transaction signature
     */
    public get signature(): Uint8Array {
        return this.payload.subarray(-64);
    }

    /**
     * Serialize transaction
     * @returns - Transaction payload bytes
     */
    public serialize(): Uint8Array {
        return Buffer.alloc(4 + 4 + 4 + 4 + this.signerPublicKey.length + 8 + 4 + this.body.size)
            .fill(Converter.numberToUint8(this.body.type, 4), 0)
            .fill(Converter.numberToUint8(this.version, 4), 4)
            .fill(Converter.numberToUint8(this.timestamp, 4), 8)
            .fill(Converter.numberToUint8(this.signerPublicKey.length, 4), 12)
            .fill(this.signerPublicKey.toBytes(), 16)
            .fill(toBufferLE(this.body.fee, 8), 48)
            .fill(Converter.numberToUint8(this.deadline.adjustedValue, 4), 56)
            .fill(this.body.serialize(), 60);
    }

    /**
     * Sign transaction and attach signature to the payload
     * @param keyPair - Signer key pair
     */
    public sign(keyPair: Nis1KeyPair): void {
        this.signerPublicKey = keyPair.publicKey; // Re-assign signer's public key
        const payload = this.serialize();
        const signature = keyPair.sign(payload);

        this.internalPayload = Buffer.alloc(4 + payload.length + 4 + signature.length)
            .fill(Converter.numberToUint8(payload.length, 4), 0)
            .fill(this.serialize(), 4)
            .fill(Converter.numberToUint8(signature.length, 4), payload.length + 4)
            .fill(signature, payload.length + 8);
    }
}
