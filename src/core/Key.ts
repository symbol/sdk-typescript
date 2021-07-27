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

import { Converter } from './utils/Converter';

export class Key {
    /**
     * Constructor
     * @param key public/private key bytes
     */
    constructor(public readonly key: Uint8Array) {}

    /**
     * Create Public/Private key from hexadecimal string
     * @param {string} key Public key string
     * @returns {Key}
     */
    public static createFromHex(key: string): Key {
        return new Key(Converter.hexToUint8(key));
    }

    /**
     * Return key bytes.
     * @returns {Uint8Array}
     */
    public toBytes(): Uint8Array {
        return this.key;
    }

    /**
     * Return key hexadecimal string.
     * @returns {string}
     */
    public toString(): string {
        return Converter.uint8ToHex(this.key);
    }

    /**
     * Key length property
     * @returns {number}
     */
    public get length(): number {
        return this.key.length;
    }
}
