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

import { Key, KeyPair } from '@core';
import * as Crypto from 'crypto';
import * as nacl from 'tweetnacl';
/**
 * Represents an ED25519 private and public key.
 */
export class SymbolKeyPair extends KeyPair {
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
    public static generate(): SymbolKeyPair {
        return new SymbolKeyPair(new Key(Crypto.randomBytes(32)));
    }

    /**
     * Derive public key from private key
     *
     * @returns Public key
     */
    protected getPublicKey(): Key {
        return new Key(nacl.sign.keyPair.fromSeed(this.privateKey.toBytes()).publicKey);
    }

    /**
     * Signs a data buffer with a key pair.
     *
     * @param data - The data to sign.
     * @returns The signature.
     */
    public sign(data: Uint8Array): Uint8Array {
        const secretKey = new Uint8Array(64);
        secretKey.set(this.privateKey.toBytes());
        secretKey.set(this.publicKey.toBytes(), 32);
        return nacl.sign.detached(data, secretKey);
    }

    /**
     * Verifies a signature.
     *
     * @param data - The data to verify.
     * @param signature - The signature to verify.
     * @returns true if the signature is verifiable, false otherwise.
     */
    public verify(data: Uint8Array, signature: Uint8Array): boolean {
        return nacl.sign.detached.verify(data, signature, this.publicKey.toBytes());
    }
}
