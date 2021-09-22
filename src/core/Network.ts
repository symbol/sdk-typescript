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

import { Address, Converter, HashUtils, Key, RawAddress } from '@core';

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
    public createAddressFromPublicKey(publicKey: Key): Address {
        const publicKeyBytes = publicKey.toBytes();
        // step 1: sha3 hash of the public key
        const publicKeyHash = this.addressHasher(publicKeyBytes);

        // step 2: ripemd160 hash of (1)
        const ripemd160Hash = HashUtils.ripemd160Hash(publicKeyHash);

        // step 3: add network identifier byte in front of (2)
        const addressWithoutChecksum = Converter.concat(Uint8Array.of(this.identifier), ripemd160Hash);

        // step 4: concatenate (3) and the checksum of (3)
        const hash = this.addressHasher(addressWithoutChecksum);
        const checksum = hash.subarray(0, 4);

        return this.createAddress({ addressWithoutChecksum, checksum });
    }

    /**
     * Abstract method that creates the right address implementation for the given network.
     * @param rawAddress - the raw address
     * @returns the address instance for the current network.
     */
    protected abstract createAddress(rawAddress: RawAddress): Address;

    /**
     * Abstract method to gets the primary hasher to use in the public key to address conversion.
     */
    public abstract addressHasher(data: Uint8Array): Uint8Array;

    /**
     * Get network by its name.
     *
     * @param networks - NemNetwork[] | SymbolNetwork[]
     * @param name - name of network, example: 'mainnet'
     * @returns filtered network
     */
    public static findByName<T extends Network>(networks: readonly T[], name: string): T | undefined {
        return networks.find((n) => n.name.toLowerCase() === name.toLowerCase());
    }

    /**
     * Get network by its identifier.
     *
     * @param networks - List of Networks
     * @param identifier - identifier of network, example: '0x68'
     * @returns filtered network
     */
    public static findByIdentifier<T extends Network>(networks: readonly T[], identifier: number): T | undefined {
        return networks.find((n) => n.identifier === identifier);
    }
}
