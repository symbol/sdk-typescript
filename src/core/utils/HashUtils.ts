/*
 * Copyright 2021 SYMBOL
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Hash, keccak256, keccak512, sha3_256 } from 'js-sha3';
import * as ripemd160 from 'ripemd160';

/**
 * The type of data HashUtils can hash.
 */
type Message = Uint8Array | string;

/**
 * Interface of a hasher that keeps the state of the hashed data.
 */
export interface Hasher {
    /**
     * @param data - the data to hash
     * @returns this hasher
     */
    update(data: Message): Hasher;

    /**
     * returns the hash of the provided data.
     * @returns the hash of the data
     */
    digest(): Uint8Array;

    /**
     * It resets the hashed data to empty
     * @returns this hasher
     */
    reset(): Hasher;
}

/**
 * A utility class to hash data easily. It handles keccak256, keccak512, sha3_256 and ripemd160 implementations.
 *
 * For each implementation, this helper provides a Hasher factory and a one-line hash function.
 *
 * This class abstracts out the the implementation, if for some reason the hashes need to be changed, it's centralized in one place.
 *
 * Clients wouldn't need to import any hash implementation like 'ripemd160' or 'js-sha3', just use this helper utils.
 */
export class HashUtils {
    /**
     * It keccak512 hashes the list of Uint8Array into a Uint8Array.
     *
     * @param data - the list of Uint8Array to hash.
     * @returns the keccak512 hash of the data.
     */
    public static keccak512Hash = (...data: Message[]): Uint8Array => {
        return HashUtils.hash(HashUtils.keccak512Hasher(), ...data);
    };

    /**
     * It creates a keccak512 hasher.
     *
     * @returns a keccak512 hasher
     */
    public static keccak512Hasher = (): Hasher => {
        return HashUtils.createHasher(keccak512);
    };

    /**
     * It keccak256 hashes the list of Uint8Array into a Uint8Array.
     *
     * @param data - the list of Uint8Array to hash.
     * @returns the keccak256 hash of the data.
     */
    public static keccak256Hash = (...data: Message[]): Uint8Array => {
        return HashUtils.hash(HashUtils.keccak256Hasher(), ...data);
    };

    /**
     * It creates a keccak256 hasher.
     *
     * @returns a keccak256 hasher
     */
    public static keccak256Hasher = (): Hasher => {
        return HashUtils.createHasher(keccak256);
    };

    /**
     * It sha256 hashes the list of Uint8Array into a Uint8Array.
     *
     * @param data - the list of Uint8Array to hash.
     * @returns the sha256 hash of the data.
     */
    public static sha256Hash = (...data: Message[]): Uint8Array => {
        return HashUtils.hash(HashUtils.sha256Hasher(), ...data);
    };
    /**
     * It creates a sha3_256 hasher.
     */
    public static sha256Hasher = (): Hasher => {
        return HashUtils.createHasher(sha3_256);
    };

    /**
     * It hashes the given items into a Uint8Array using the provided hasher.
     * @param hasher - the hasher algorithm.
     * @param data - the item to hash
     */
    private static hash(hasher: Hasher, ...data: Message[]): Uint8Array {
        hasher.reset();
        data.forEach((hashVal: Uint8Array) => {
            hasher.update(hashVal);
        });
        return hasher.digest();
    }

    /**
     * It ripemd160 hashes the list of Uint8Array into a Uint8Array.
     *
     * @param data - the list of Uint8Array to hash.
     * @returns the ripemd160 hash of the data.
     */
    public static ripemd160Hash = (...data: Uint8Array[]): Uint8Array => {
        return HashUtils.hash(HashUtils.ripemd160Hasher(), ...data);
    };

    /**
     * It creates a ripemd160 hasher.
     *
     * @returns a ripemd160 hasher
     */
    public static ripemd160Hasher = (): Hasher => {
        let hasherImpl = new ripemd160();
        const hasher: Hasher = {
            update: (data: Message): Hasher => {
                hasherImpl.update(Buffer.from(data));
                return hasher;
            },
            digest: () => hasherImpl.digest(),
            reset: (): Hasher => {
                hasherImpl = new ripemd160();
                return hasher;
            },
        };
        return hasher;
    };

    /**
     * It creates a Hasher from the provided js-sha3
     * @param hash - the js-sha3 hash
     * @returns the Hasher wrapper.
     */
    private static createHasher(hash: Hash): Hasher {
        let hasherImpl = hash.create();
        const hasher: Hasher = {
            update: (data: Message): Hasher => {
                hasherImpl.update(data);
                return hasher;
            },
            digest: () => Uint8Array.from(hasherImpl.digest()),
            reset: (): Hasher => {
                hasherImpl = hash.create();
                return hasher;
            },
        };
        return hasher;
    }
}
