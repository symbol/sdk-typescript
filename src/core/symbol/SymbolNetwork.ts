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

import { HashUtils, Network, RawAddress, SymbolAddress, SymbolNetworkList, SymbolTransactionFactory } from '@core';

export class SymbolNetwork extends Network {
    /**
     * Constructor
     *
     * @param name - Network name
     * @param identifier - Network identifier
     * @param generationHash - Symbol network generation hash
     */
    constructor(name: string, identifier: number, public readonly generationHash: string) {
        super(name, identifier);
    }

    /**
     * Creates a transaction factory for symbol transaction.
     */
    public createTransactionFactory(): SymbolTransactionFactory {
        return new SymbolTransactionFactory(this);
    }

    /**
     * Get hasher for address generation based on selected network type
     *
     */
    public addressHasher = HashUtils.sha256Hash;

    /**
     * List all networks
     *
     * @returns Symbol network list
     */
    public static list(): ReadonlyArray<SymbolNetwork> {
        return SymbolNetworkList.map((n) => new SymbolNetwork(n.name, n.identifier, n.generationHash));
    }
    /**
     * It creates the address for the symbol network.
     * @param rawAddress - the raw address
     * @returns the symbol address instance
     */
    protected createAddress(rawAddress: RawAddress): SymbolAddress {
        return new SymbolAddress(rawAddress);
    }
}
