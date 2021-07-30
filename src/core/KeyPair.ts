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

import { Key } from './Key';
import { Converter } from './utils';

export abstract class KeyPair {
    public readonly publicKey: Key;

    /**
     *Constructor
     * @param {string} privateKey Private Key
     */
    constructor(public readonly privateKey: Key) {
        // sanity
        Converter.validateHexString(privateKey.toString(), 64, 'Invalid PrivateKey');
        this.publicKey = this.getPublicKey();
    }

    /**
     * Abastrct method to derive public key from private key
     * @returns {Key}
     */
    public abstract getPublicKey(): Key;

    /**
     * Abstract method to signs a data buffer with a key pair.
     * @param {Uint8Array} data The data to sign.
     * @returns {Uint8Array} The signature.
     */
    public abstract sign(data: Uint8Array): Uint8Array;

    /**
     * Abstract method to verifies a signature.
     * @param {Uint8Array} data The data to verify.
     * @param {Uint8Array} signature The signature to verify.
     * @returns {boolean} true if the signature is verifiable, false otherwise.
     */
    public abstract verify(data: Uint8Array, signature: Uint8Array): boolean;
}
