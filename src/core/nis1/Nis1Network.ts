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

import { Hash, keccak256 } from 'js-sha3';
import { NIS1NetworkList } from '../constants';
import { Network } from '../Network';

export class Nis1Network extends Network {
    /**
     * Constructor
     * @param {string} name Nis1 Network name
     * @param {number} identifier Nis1 Network identifier
     */
    constructor(name: string, identifier: number) {
        super(name, identifier);
    }

    /**
     * Get hasher for address generation based on selected network type
     * @returns {SHA3}
     */
    public addressHasher(): Hash {
        return keccak256;
    }

    /**
     * Get network by its name
     * @param {string} name Network name
     * @returns {Network | undefined}
     */
    public static findByName(name: string): Nis1Network | undefined {
        const network = NIS1NetworkList.find((n) => n.name.toLowerCase() === name.toLowerCase());
        if (network) {
            return new Nis1Network(network.name, network.identifier);
        }
        return undefined;
    }

    /**
     * Get network by its identifier
     * @param {number} identifier Network identifier
     * @returns {Network | undefined}
     */
    public static findByIdentifier(identifier: number): Nis1Network | undefined {
        const network = NIS1NetworkList.find((n) => n.identifier === identifier);
        if (network) {
            return new Nis1Network(network.name, network.identifier);
        }
        return undefined;
    }

    /**
     * List all networks
     * @returns {Nis1Network[]}
     */
    public static list(): ReadonlyArray<Nis1Network> {
        return NIS1NetworkList.map((n) => new Nis1Network(n.name, n.identifier));
    }
}
