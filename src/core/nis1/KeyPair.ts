/*
 * Copyright 2021 NEM
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
import * as Crypto from 'crypto';
import { Converter } from '../utils/Converter';
import { keccakHash, KeccakHasher } from '../utils/Utilities';
const Ed25519 = require('./external/nacl-fast.js').lowlevel;

export class KeyPair {
    /**
     * Private properties
     */
    private readonly privateKey: Uint8Array;
    private readonly publicKey: Uint8Array;

    /**
     *Constructor
     * @param {string} privateKey Private Key
     */
    constructor(privateKey: string) {
        // sanity
        Converter.validateHexString(privateKey, Ed25519.crypto_sign_SECRETKEYBYTES, 'Invalid PrivateKey');

        this.privateKey = Converter.hexToUint8(privateKey, true);
        this.publicKey = new Uint8Array(Ed25519.crypto_sign_PUBLICKEYBYTES);

        Ed25519.crypto_sign_keypair_hash(this.publicKey, this.privateKey, keccakHash);
    }

    /**
     * @property Public key
     * @returns {string} Raw public key string
     */
    get PublicKey(): string {
        return Converter.uint8ToHex(this.publicKey);
    }

    /**
     * @property Private key
     * @returns {string} Raw private key string
     */
    get PrivateKey(): string {
        const hexPrivateKey = Converter.uint8ToHex(this.privateKey);
        const reversePrivateKey = Converter.hexToUint8(hexPrivateKey, true);

        return Converter.uint8ToHex(reversePrivateKey);
    }

    /**
     * Generate a random new keypair
     * @returns {KeyPair} New keypair
     */
    public static generate(): KeyPair {
        return new KeyPair(Converter.uint8ToHex(Crypto.randomBytes(32)));
    }

    /**
     * Signs a data buffer with a key pair.
     * @param {Uint8Array} data The data to sign.
     * @returns {Uint8Array} The signature.
     */
    public sign(data: Uint8Array): Uint8Array {
        const signature = new Uint8Array(64);
        const hasher = KeccakHasher();
        const signed = Ed25519.crypto_sign_hash(signature, this, data, hasher);

        if (!signed) {
            throw new Error(`Couldn't sign the tx, generated invalid signature`);
        }

        return signature;
    }

    /**
     * Verifies a signature.
     * @param {Uint8Array} data The data to verify.
     * @param {Uint8Array} signature The signature to verify.
     * @returns {boolean} true if the signature is verifiable, false otherwise.
     */
    public verify(data: Uint8Array, signature: Uint8Array): boolean {
        const hasher = KeccakHasher();
        return Ed25519.crypto_verify_hash(signature, this.publicKey, data, hasher);
    }
}
