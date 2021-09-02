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

import { Address, NemAddress, NemNetworkList, NemTransactionFactory, Network, RawAddress } from '@core';
import { Hash, keccak256 } from 'js-sha3';

export class NemNetwork extends Network {
    /**
     * Constructor
     *
     * @param name - Nem Network name
     * @param identifier - Nem Network identifier
     */
    constructor(name: string, identifier: number) {
        super(name, identifier);
    }

    /**
     * Get hasher for address generation based on selected network type
     *
     * @returns hasher
     */
    public addressHasher(): Hash {
        return keccak256;
    }

    /**
     * Creates a transaction factory for Nem transaction.
     */
    public createTransactionFactory(): NemTransactionFactory {
        return new NemTransactionFactory(this);
    }

    /**
     * List all networks
     *
     * @returns read array of networks
     */
    public static list(): ReadonlyArray<NemNetwork> {
        return NemNetworkList.map((n) => new NemNetwork(n.name, n.identifier));
    }

    /**
     * It creates the address for the Nem network.
     * @param rawAddress - the raw address
     * @returns the Nem address instance.
     */
    protected createAddress(rawAddress: RawAddress): Address {
        return new NemAddress(rawAddress);
    }
}
