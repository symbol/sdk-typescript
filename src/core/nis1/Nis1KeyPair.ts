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
import { Key, KeyPair } from '@core';
import { keccakHash, KeccakHasher } from '@utils';
import * as Crypto from 'crypto';
/* eslint @typescript-eslint/no-var-requires: "off" */
const Ed25519 = require('./external/nacl-fast.js').lowlevel;

export class Nis1KeyPair extends KeyPair {
    /**
     * Constructor
     *
     * @param privateKey - Private Key
     */
    constructor(privateKey: Key) {
        super(privateKey);
    }

    /**
     * Generate a random new keypair
     *
     * @returns New keypair
     */
    public static generate(): Nis1KeyPair {
        return new Nis1KeyPair(new Key(Crypto.randomBytes(32)));
    }

    /**
     * Derive public key from private key
     *
     * @returns Public key
     */
    protected getPublicKey(): Key {
        const publicKey = new Key(new Uint8Array(Ed25519.crypto_sign_PUBLICKEYBYTES));
        const reversedPrivateKey = [...this.privateKey.toBytes()].reverse();

        Ed25519.crypto_sign_keypair_hash(publicKey.toBytes(), reversedPrivateKey, keccakHash);

        return publicKey;
    }

    /**
     * Signs a data buffer with a key pair.
     *
     * @param data - The data to sign.
     * @returns The signature.
     */
    public sign(data: Uint8Array): Uint8Array {
        const signature = new Uint8Array(64);
        const hasher = KeccakHasher();

        const keypair = {
            privateKey: [...this.privateKey.toBytes()].reverse(),
            publicKey: this.publicKey.toBytes(),
        };

        const success = Ed25519.crypto_sign_hash(signature, keypair, data, hasher);

        if (!success) {
            throw new Error(`Couldn't sign the tx, generated invalid signature`);
        }

        return signature;
    }

    /**
     * Verifies a signature.
     *
     * @param data - The data to verify.
     * @param signature - The signature to verify.
     * @returns true if the signature is verifiable, false otherwise.
     */
    public verify(data: Uint8Array, signature: Uint8Array): boolean {
        const hasher = KeccakHasher();
        return Ed25519.crypto_verify_hash(signature, this.publicKey.toBytes(), data, hasher);
    }
}
