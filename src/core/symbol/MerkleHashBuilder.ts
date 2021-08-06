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

import { sha3_256 } from 'js-sha3';

export class MerkleHashBuilder {
    /**
     * The list of hashes used to calculate root hash.
     */
    private hashes: Uint8Array[] = new Array<Uint8Array>();

    /**
     * Calculates the merkle hash.
     *
     * @returns Root merkle hash
     */
    public final(): Uint8Array {
        if (this.hashes.length === 0) {
            return new Uint8Array(32);
        }

        let numRemainingHashes = this.hashes.length;
        while (numRemainingHashes > 1) {
            for (let i = 0; i < numRemainingHashes; i += 2) {
                if (i + 1 < numRemainingHashes) {
                    this.hashes.splice(Math.floor(i / 2), 0, this.hash([this.hashes[i], this.hashes[i + 1]]));
                    continue;
                }

                // if there is an odd number of hashes, duplicate the last one
                this.hashes.splice(Math.floor(i / 2), 0, this.hash([this.hashes[i], this.hashes[i]]));
                ++numRemainingHashes;
            }
            numRemainingHashes = Math.floor(numRemainingHashes / 2);
        }
        return this.hashes[0];
    }

    /**
     * Update hashes array (add hash)
     *
     * @param hash - Inner transaction hash buffer
     * @returns MerkleHashBuilder object
     */
    public update(hash: Uint8Array): MerkleHashBuilder {
        this.hashes.push(hash);
        return this;
    }

    /**
     * Hash inner transactions
     *
     * @param hashes - Inner transaction hashes
     * @returns Hashed bytes
     */
    private hash(hashes: Uint8Array[]): Uint8Array {
        const hasher = sha3_256.create();

        hashes.forEach((hashVal: Uint8Array) => {
            hasher.update(hashVal);
        });
        return new Uint8Array(hasher.arrayBuffer());
    }
}
