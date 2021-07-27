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
import { Keccak, SHA3 } from 'sha3';
import { RawAddress } from './Address';
import { Key } from './Key';

export abstract class Network {
    /**
     * Constructor
     * @param {string} name Network name
     * @param {number} identifier Network identifier
     */
    constructor(public readonly name: string, public readonly identifier: number) {}

    /**
     * Generate raw address bytes and chechsum from public key.
     * @param {string} publicKey Public key
     * @returns {RawAddress}
     */
    public createAddressFromPublicKey(publicKey: Key): RawAddress {
        const publicKeyBytes = publicKey.toBytes();
        // step 1: sha3 hash of the public key
        const publicKeyHash = this.addressHasher().update(Buffer.from(publicKeyBytes));

        // step 2: ripemd160 hash of (1)
        const ripemd160Hash = new ripemd160().update(publicKeyHash.digest()).digest();

        // step 3: add network identifier byte in front of (2)
        const addressWithoutChecksum = new Uint8Array(ripemd160Hash.length + 1);
        addressWithoutChecksum.set(Uint8Array.of(this.identifier), 0);
        addressWithoutChecksum.set(ripemd160Hash, 1);

        // step 4: concatenate (3) and the checksum of (3)
        const hash = this.addressHasher().update(Buffer.from(addressWithoutChecksum)).digest();
        const checksum = hash.subarray(0, 4);

        return { addressWithoutChecksum, checksum };
    }

    /**
     * Abstract method to gets the primary hasher to use in the public key to address conversion.
     * @returns {SHA3 | Keccak}
     */
    public abstract addressHasher(): SHA3 | Keccak;
}
