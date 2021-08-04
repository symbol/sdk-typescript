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

import { Network, SymbolNetworkList } from '@core';
import { Hash, sha3_256 } from 'js-sha3';

export class SymbolNetwork extends Network {
    /**
     * Constructor
     * @param {string} name Network name
     * @param {number} identifier Network identifier
     * @param {string} generationHash Symbol network generation hash
     */
    constructor(name: string, identifier: number, public readonly generationHash: string) {
        super(name, identifier);
    }

    /**
     * Get hasher for address generation based on selected network type
     * @returns {SHA3}
     */
    public addressHasher(): Hash {
        return sha3_256;
    }

    /**
     * Get network by its name
     * @param {string} name Network name
     * @returns {Network | undefined}
     */
    public static findByName(name: string): SymbolNetwork | undefined {
        const network = SymbolNetworkList.find((n) => n.name.toLowerCase() === name.toLowerCase());
        if (network) {
            return new SymbolNetwork(network.name, network.identifier, network.generationHash);
        }
        return undefined;
    }

    /**
     * Get network by its identifier
     * @param {number} identifier Network identifier
     * @returns {Network | undefined}
     */
    public static findByIdentifier(identifier: number): SymbolNetwork | undefined {
        const network = SymbolNetworkList.find((n) => n.identifier === identifier);
        if (network) {
            return new SymbolNetwork(network.name, network.identifier, network.generationHash);
        }
        return undefined;
    }

    /**
     * List all networks
     * @returns {SymbolNetwork[]}
     */
    public static list(): SymbolNetwork[] {
        return SymbolNetworkList.map((n) => new SymbolNetwork(n.name, n.identifier, n.generationHash));
    }
}
