/*
 * Copyright 2021 SYMBOL
 *
 * Licensed under the Apache License, Version 2.0 (the "License"),
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
import { keccakHash } from '@utils';
import * as Crypto from 'crypto';
import { keccak256 } from 'js-sha3';

/* eslint @typescript-eslint/no-var-requires: "off" */
const Ed25519 = require('./external/nacl-fast.js').lowlevel;

export class NemCrypto {
    /**
     * AES cipher algorithm (internal)
     */
    private static algorithm = 'aes-256-cbc';

    /**
     * Key derive for cipher
     *
     * @param shared - shared secret
     * @param salt - A salt
     * @param privateKey - A private key
     * @param publicKey - A public key
     *
     * @returns Keccak-256 hash
     */
    private static key_derive(shared: Uint8Array, salt: Uint8Array, privateKey: Key, publicKey: Key): number[] {
        Ed25519.crypto_shared_key_hash(shared, publicKey.toBytes(), [...privateKey.toBytes()].reverse(), keccakHash);

        for (let i = 0; i < salt.length; i++) {
            shared[i] ^= salt[i];
        }

        return keccak256.digest(shared);
    }

    /**
     * Encode a message
     *
     * @param privateKey - A sender private key
     * @param publicKey - A recipient public key
     * @param message - A text message
     * @param customIv - An initialization vector
     * @param customSalt - A salt
     *
     * @returns The encoded message
     */
    static encode(privateKey: Key, publicKey: Key, message: Uint8Array, customIv?: Uint8Array, customSalt?: Uint8Array): Uint8Array {
        if (message.length > 32) throw new Error('Invalid message size!');

        const iv = customIv ? customIv : Crypto.randomBytes(16);
        const salt = customSalt ? customSalt : Crypto.randomBytes(32);

        const shared = new Uint8Array(32);
        const key = this.key_derive(shared, salt, privateKey, publicKey);

        const cipher = Crypto.createCipheriv(this.algorithm, Buffer.from(key), iv);
        const encrypted = Buffer.concat([cipher.update(message), cipher.final()]);

        // return Converter.uint8ToHex(salt) + Converter.uint8ToHex(iv) + encrypted.toString('hex').toUpperCase();
        return Buffer.concat([salt, iv, encrypted]);
    }

    /**
     * Decode an encrypted message payload
     *
     * @param privateKey - A recipient private key
     * @param publicKey - A sender public key
     * @param payload - An encrypted message payload
     *
     * @returns The decoded message
     */
    static decode(privateKey: Key, publicKey: Key, payload: Uint8Array): Uint8Array {
        if (payload.length !== 80) throw new Error('Invalid payload size!');

        // 32 byte for salt
        const salt = payload.slice(0, 32);
        // 16 byte for iv
        const iv = payload.slice(32, 48);
        // 32 byte for payload
        const message = payload.slice(48);

        const shared = new Uint8Array(32);
        const key = this.key_derive(shared, salt, privateKey, publicKey);

        const decipher = Crypto.createDecipheriv(this.algorithm, Buffer.from(key), iv);
        const decoded = Buffer.concat([decipher.update(message), decipher.final()]);

        return decoded;
    }
}
