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

import ripemd160 = require('ripemd160');
import { Key, Nis1Network, RawAddress, SymbolNetwork } from '@core';
import { Hash } from 'js-sha3';

export abstract class Network {
    /**
     * Constructor
     *
     * @param name - Network name
     * @param identifier - Network identifier
     */
    constructor(public readonly name: string, public readonly identifier: number) {}

    /**
     * Generate raw address bytes and checksum from public key.
     *
     * @param publicKey - Public key
     * @returns Raw address and its checksum bytes
     */
    public createAddressFromPublicKey(publicKey: Key): RawAddress {
        const publicKeyBytes = publicKey.toBytes();
        // step 1: sha3 hash of the public key
        const publicKeyHash = this.addressHasher().arrayBuffer(publicKeyBytes);

        // step 2: ripemd160 hash of (1)
        const ripemd160Hash = new ripemd160().update(Buffer.from(publicKeyHash)).digest();

        // step 3: add network identifier byte in front of (2)
        const addressWithoutChecksum = new Uint8Array(ripemd160Hash.length + 1);
        addressWithoutChecksum.set(Uint8Array.of(this.identifier), 0);
        addressWithoutChecksum.set(ripemd160Hash, 1);

        // step 4: concatenate (3) and the checksum of (3)
        const hash = this.addressHasher().arrayBuffer(addressWithoutChecksum);
        const checksum = new Uint8Array(hash).subarray(0, 4);

        return { addressWithoutChecksum, checksum };
    }

    /**
     * Abstract method to gets the primary hasher to use in the public key to address conversion.
     */
    public abstract addressHasher(): Hash;

    /**
     * Get network by its name
     * @param {networks} networks
     * @returns Nis1Network | SymbolNetwork | undefined
     */
    public static findByName(networks: Nis1Network[] | SymbolNetwork[], name: string): Nis1Network | SymbolNetwork | undefined {
        const network = networks.find((n) => n.name.toLowerCase() === name.toLowerCase());

        if (!network) return undefined;

        return network;
    }

    /**
     * Get network by its identifier
     * @param {networks} networks
     * @returns Nis1Network | SymbolNetwork | undefined
     *
     */
    public static findByIdentifier(networks: Nis1Network[] | SymbolNetwork[], identifier: number): Nis1Network | SymbolNetwork | undefined {
        const network = networks.find((n) => n.identifier === identifier);

        if (!network) return undefined;

        return network;
    }
}
