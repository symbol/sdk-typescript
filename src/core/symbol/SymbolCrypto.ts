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
import * as crypto from 'crypto';
import * as hkdf from 'futoin-hkdf';
import { sha512 } from 'js-sha512';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as nacl from './external/nacl_catapult';

/**
 * Prepare scalar mulResult
 * @param privateKey - Private key.
 * @returns - Prepared scalar mulResult
 */
const prepareForScalarMult = (privateKey: Uint8Array): Uint8Array => {
    const hash = sha512.arrayBuffer(privateKey);
    const d = new Uint8Array(hash);
    //Clamp
    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;
    return d;
};

/***
 * Encode a message, separated from encode() to help testing
 *
 * @param privateKey - Sender's private key.
 * @param otherPublicKey - Recipient's public key.
 * @param message - Message to be encoded.
 * @param customIv - Custom 12 bytes initialization vector otherwise random bytes are used.
 * @returns - Encoded message bytes
 */
export const encode = (privateKey: Key, otherPublicKey: Key, message: Uint8Array, customIv?: Uint8Array): Uint8Array => {
    // Validate parameters
    if (privateKey.length !== 32 || otherPublicKey.length !== 32 || message.length === 0 || (customIv && customIv.length !== 12)) {
        throw new Error('Invalid parameter(s)!');
    }

    // Processing
    const sharedKey = deriveSharedKey(privateKey.toBytes(), otherPublicKey.toBytes());
    const iv = customIv ? customIv : crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', sharedKey, iv);
    const encrypted = Buffer.concat([cipher.update(message), cipher.final()]);
    const tag = cipher.getAuthTag();
    return new Uint8Array(Buffer.concat([tag, iv, encrypted]));
};

/**
 * Decode an encrypted message payload
 *
 * @param privateKey - Recipient's private key
 * @param otherPublicKey - Sender's public key
 * @param payload - Encoded message payload in bytes
 * @param tagAndIv - 16-bytes AES auth tag and 12-byte AES initialization vector
 * @returns - Decoded message bytes
 */
export const decode = (privateKey: Key, otherPublicKey: Key, payload: Uint8Array): Uint8Array => {
    // Validate parameters
    if (privateKey.length !== 32 || otherPublicKey.length !== 32 || payload.length <= 28) {
        throw new Error('Invalid parameter(s)!');
    }

    // Processing
    const messagePayload = new Uint8Array(payload.buffer, 16 + 12); //16-bytes AES auth tag and 12-byte AES initialization vector
    const tag = new Uint8Array(payload.buffer, 0, 16);
    const iv = new Uint8Array(payload.buffer, 16, 12);
    const sharedKey = deriveSharedKey(privateKey.toBytes(), otherPublicKey.toBytes());
    const cipher = crypto.createDecipheriv('aes-256-gcm', sharedKey, iv);
    cipher.setAuthTag(tag);
    const decoded = Buffer.concat([cipher.update(messagePayload), cipher.final()]);
    return decoded;
};

/**
 * Derive shared secret
 * @param privateKey - Private key bytes
 * @param publicKey - Public key bites
 * @returns - Shared secret
 */
export const deriveSharedSecret = (privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array => {
    const c = nacl;
    const d = prepareForScalarMult(privateKey);

    // sharedKey = pack(p = d (derived from privateKey) * q (derived from publicKey))
    const q = [c.gf(), c.gf(), c.gf(), c.gf()];
    const p = [c.gf(), c.gf(), c.gf(), c.gf()];
    const sharedSecret = new Uint8Array(32);

    c.unpack(q, publicKey);
    c.scalarmult(p, q, d);
    c.pack(sharedSecret, p);
    return sharedSecret;
};

/**
 * Derive a shared key from different key pairs
 * @param privateKey - Private key
 * @param publicKey - Public key
 * @returns - Shared key
 */
export const deriveSharedKey = (privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array => {
    const sharedSecret = deriveSharedSecret(privateKey, publicKey);
    const info = 'catapult';
    const hash = 'SHA-256';
    return hkdf(Buffer.from(sharedSecret), 32, { salt: Buffer.alloc(32), info, hash });
};
