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

import { Deadline, Key, NemNetwork, NemSerializer } from '@core';
import { NemTransaction } from './NemTransaction';

/**
 * Nem transaction factory
 */
export class NemTransactionFactory {
    /**
     * Constructor
     * @param network - Nem network.
     */
    constructor(private readonly network: NemNetwork) {}

    /**
     * Create generic Nem transaction.
     *
     * @param deadline - Transaction deadline
     * @param signerPublicKey - Signer's public key
     * @param body - Nem transaction body.
     */
    public create(deadline: Deadline, signerPublicKey: Key, body: NemSerializer.Serializer): NemTransaction<NemSerializer.Serializer> {
        return new NemTransaction(this.network, deadline, signerPublicKey, body);
    }
}
