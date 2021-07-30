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
import { toBigIntLE, toBufferLE } from 'bigint-buffer';
import * as Crypto from 'crypto';
import { sha3_256 } from 'js-sha3';
import { Address } from '../Address';
import { NamespaceConst } from '../Constants';

export class SymbolIdGenerator {
    /**
     * Generate a mosaic id
     * @param {Address} ownerAddress Mosaic owner's address bytes
     * @param {Uint8Array} nonce Mosaic nonce bytes
     * @returns {BigInt}
     */
    public static generateMosaicId(ownerAddress: Address, nonce: Uint8Array): bigint {
        const hash = sha3_256.create();
        hash.update(nonce);
        hash.update(ownerAddress.getAddressBytes());
        const result = new Uint32Array(hash.arrayBuffer());
        return toBigIntLE(Buffer.from(new Uint32Array([result[0], result[1] & 0x7fffffff]).buffer));
    }

    /**
     * Generate a random 4 bytes nonce
     * @returns {Uint8Array}
     */
    public static generateRandomMosaicNonce(): Uint8Array {
        return Crypto.randomBytes(4);
    }

    /**
     * Generate namespace id
     * @param {string} name Namespace name
     * @param {bigint} parentId Parent namespace id
     * @returns {bigint}
     */
    public static generateNamespaceId(name: string, parentId = BigInt(0)): bigint {
        const hash = sha3_256.create();
        hash.update(toBufferLE(parentId, 8));
        hash.update(name);
        const result = new Uint32Array(hash.arrayBuffer());
        // right zero-filling required to keep unsigned number representation
        return toBigIntLE(Buffer.from(new Uint32Array([result[0], (result[1] | 0x80000000) >>> 0]).buffer));
    }

    /**
     * Generate a namespace path.
     * @param {string} fullName The fully qualified namespace name. e.g. abc.def.ghi
     * @returns {array<module:coders/uint64~uint64>} The namespace path.
     */
    public static generateNamespacePath = (fullName: string): bigint[] => {
        if (0 >= fullName.length) {
            throw new Error(`${fullName} has zero length`);
        }
        let parentId = BigInt(0);
        const path: bigint[] = [];
        fullName.split('.').forEach((name) => {
            if (!SymbolIdGenerator.isValidNamespaceName(name)) {
                throw new Error(`fully qualified name is invalid due to invalid part name (${fullName})`);
            }
            path.push(SymbolIdGenerator.generateNamespaceId(name, parentId));
            parentId = path[-1];
        });
        return path;
    };

    /**
     * Returns true if a name is a valid namespace name.
     * @param name Namespace name
     * @returns {boolean}
     */
    public static isValidNamespaceName(name: string): boolean {
        return NamespaceConst.name_pattern.test(name);
    }
}
