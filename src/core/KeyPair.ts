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

import { Key } from '@core';
import Ed25519 from '@external';
import { Converter } from '@utils';

export abstract class KeyPair {
    /**
     * Constructor
     *
     * @param privateKey - The private key.
     * @param publicKey - The derived public key from the provided private key.
     */
    protected constructor(public readonly privateKey: Key, public readonly publicKey: Key) {
        // sanity
        Converter.validateHexString(privateKey.toString(), 64, 'Invalid PrivateKey');
        Converter.validateHexString(publicKey.toString(), 64, 'Invalid PublicKey');
    }

    /**
     * Abstract method to signs a data buffer with a key pair.
     *
     * @param data - The data to sign.
     * @returns The signature.
     */
    public abstract sign(data: Uint8Array): Uint8Array;

    /**
     * Abstract method to verifies a signature.
     *
     * @param data - The data to verify.
     * @param signature - The signature to verify.
     * @returns true if the signature is verifiable, false otherwise.
     */
    public abstract verify(data: Uint8Array, signature: Uint8Array): boolean;

    /**
     * Determines if a signature's S part is canonical or not.
     *
     * @param signatureS - The S part of the signature to verify.
     * @returns true if the signature is canonical, false otherwise.
     */
    protected IsCanonicalS(signatureS: Uint8Array): boolean {
        if (signatureS.every((x) => 0 == x)) return false;

        // copy to larger space
        const x = new Float64Array(64);
        const reduced = new Uint8Array(64);
        for (let i = 0; i < 32; ++i) x[i] = signatureS[i];

        Ed25519.crypto_modL(reduced, x);
        let result = 0;
        for (let i = 0; i < 32; ++i) result += reduced[i] ^ signatureS[i];

        return 0 == result;
    }
}
