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

import { Converter } from '@utils';

export class Key {
    /**
     * Constructor
     *
     * @param {Uint8Array} key public/private key bytes
     */
    constructor(public readonly key: Uint8Array) {}

    /**
     * Create Public/Private key from hexadecimal string
     *
     * @param {string} key Public key string
     * @returns {Key} The Key object
     */
    public static createFromHex(key: string): Key {
        return new Key(Converter.hexToUint8(key));
    }

    /**
     * Return key bytes.
     *
     * @returns {Uint8Array} Bytes of the key
     */
    public toBytes(): Uint8Array {
        return this.key;
    }

    /**
     * Return key hexadecimal string.
     *
     * @returns {string} Hexadecimal string
     */
    public toString(): string {
        return Converter.uint8ToHex(this.key);
    }

    /**
     * Key length property
     *
     * @returns {number} Key length
     */
    public get length(): number {
        return this.key.length;
    }
}
