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
import { Key } from '../Key';
import { KeyPair } from '../KeyPair';
import { Converter } from '../utils/Converter';
import { keccakHash, KeccakHasher } from '../utils/Utilities';
const Ed25519 = require('./external/nacl-fast.js').lowlevel;

export class Nis1KeyPair extends KeyPair {
    /**
     *Constructor
     * @param {string} privateKey Private Key
     */
    constructor(privateKey: Key) {
        super(privateKey);
    }

    /**
     * Generate a random new keypair
     * @returns {KeyPair} New keypair
     */
    public static generate(): Nis1KeyPair {
        return new Nis1KeyPair(new Key(Crypto.randomBytes(32)));
    }

    /**
     * @property Public key
     * @returns {string} Raw public key string
     */
    public getPublicKey(): Key {
        const publicKey = new Key(new Uint8Array(Ed25519.crypto_sign_PUBLICKEYBYTES));
        const reversedPrivateKey = Converter.hexToUint8(this.PrivateKey.toString(), true);

        Ed25519.crypto_sign_keypair_hash(publicKey.toBytes(), reversedPrivateKey, keccakHash);

        return publicKey;
    }

    /**
     * Signs a data buffer with a key pair.
     * @param {Uint8Array} data The data to sign.
     * @returns {Uint8Array} The signature.
     */
    public sign(data: Uint8Array): Uint8Array {
        const signature = new Uint8Array(64);
        const hasher = KeccakHasher();

        const keypair = {
            privateKey: Converter.hexToUint8(this.PrivateKey.toString(), true),
            publicKey: this.PublicKey.toBytes(),
        };

        const signed = Ed25519.crypto_sign_hash(signature, keypair, data, hasher);

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
        return Ed25519.crypto_verify_hash(signature, this.PublicKey.toBytes(), data, hasher);
    }
}
