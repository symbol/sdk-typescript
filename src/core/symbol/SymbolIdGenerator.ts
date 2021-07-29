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
import { NamespaceConst } from '../Constants';
import { Converter } from '../utils/Converter';

export class SymbolIdGenerator {
    /**
     * Generate a mosaic id
     * @param {Uint8Array} ownerAddress Mosaic owner's address bytes
     * @param {Uint8Array} nonce Mosaic nonce bytes
     * @returns {BigInt}
     */
    public static generateMosaicId(ownerAddress: Uint8Array, nonce: Uint8Array): bigint {
        const hash = sha3_256.create();
        hash.update(nonce);
        hash.update(ownerAddress);
        const result = new Uint32Array(hash.arrayBuffer());
        const buffer = Converter.uint32ToUint8(new Uint32Array([result[0], result[1] & 0x7fffffff]));
        return toBigIntLE(Buffer.from(buffer));
    }

    /**
     * Generate a random 4 bytes nonce
     * @returns {Uint8Array}
     */
    public static generateRandomMosaicNonce(): Uint8Array {
        return Crypto.randomBytes(4);
    }

    public static generateNamespaceId(name: string, parentId: bigint = BigInt(0)): bigint {
        const hash = sha3_256.create();
        hash.update(toBufferLE(parentId, 8));
        hash.update(name);
        const result = new Uint32Array(hash.arrayBuffer());
        // right zero-filling required to keep unsigned number representation
        const buffer = Converter.uint32ToUint8(new Uint32Array([result[0], (result[1] | 0x80000000) >>> 0]));
        return toBigIntLE(Buffer.from(buffer));
    }

    /**
     * Generate a namespace path.
     * @param {string} fully_qualified_name The unified namespace name.
     * @returns {array<module:coders/uint64~uint64>} The namespace path.
     */
    public static generateNamespacePath = (fully_qualified_name: string): bigint[] => {
        if (0 >= fully_qualified_name.length) {
            throw new Error(`${fully_qualified_name} has zero length`);
        }
        let parent_namespace_id: bigint = BigInt(0);
        const path: bigint[] = [];
        fully_qualified_name.split('.').forEach((name) => {
            if (!SymbolIdGenerator.isValidNamespaceName(name)) {
                throw new Error(`fully qualified name is invalid due to invalid part name (${fully_qualified_name})`);
            }
            path.push(SymbolIdGenerator.generateNamespaceId(name, parent_namespace_id));
            parent_namespace_id = path[-1];
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
