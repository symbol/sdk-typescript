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

import { Key, Nis1Deadline, Nis1Network, Nis1Serializer } from '@core';
import { Nis1Transaction } from './Nis1Transaction';

/**
 * Nis1 transaction factory
 */
export class Nis1TransactionFactory {
    /**
     * Constructor
     * @param network - Nis1 network.
     */
    constructor(private readonly network: Nis1Network) {}

    /**
     * Create generic Nis1 transaction.
     *
     * @param deadline - Transaction deadline
     * @param signerPublicKey - Signer's public key
     * @param body - Nis1 transaction body.
     */
    public create(
        deadline: Nis1Deadline,
        signerPublicKey: Key,
        body: Nis1Serializer.Serializer,
    ): Nis1Transaction<Nis1Serializer.Serializer> {
        return new Nis1Transaction(this.network, deadline, signerPublicKey, body);
    }
}
