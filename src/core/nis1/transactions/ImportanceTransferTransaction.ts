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

import { Key } from '@core';
import { Converter } from '../../utils/Converter';
import { ImportanceTransferMode, Nis1TransactionType as TransactionType } from '../Nis1Enums';
import { Serializer } from './Serializer';

/**
 * Nis1 Importance transfer transaction
 */
export class ImportanceTransferTransaction implements Serializer {
    /**
     * Constructor
     * @param remotePublicKey - Remote account public key
     * @param mode - Transfer mode
     */
    constructor(public readonly remotePublicKey: Key, public readonly mode: ImportanceTransferMode) {}

    /**
     * Property: transaction body size
     */
    public get size(): number {
        return this.serialize().length;
    }

    /**
     * Property: transaction fees
     */
    public get fee(): bigint {
        return BigInt(150000); // min fees
    }

    /**
     * Property: transaction type
     */
    public get type(): TransactionType {
        return TransactionType.IMPORTANCE_TRANSFER;
    }

    /**
     * Serialize transaction body
     * @returns - Transaction body bytes
     */
    public serialize(): Uint8Array {
        return Buffer.alloc(this.remotePublicKey.length + 4 + 4)
            .fill(Converter.numberToUint8(this.mode, 4), 0)
            .fill(Converter.numberToUint8(this.remotePublicKey.length, 4), 4)
            .fill(this.remotePublicKey.toBytes(), 8);
    }
}
